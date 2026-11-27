from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.routes.admin import (
    archive_jadwal_bansos,
    create_eligible_resident,
    create_jadwal_bansos,
    create_warga,
    get_jadwal_bansos,
    update_eligible_resident,
    update_warga,
)
from app.api.routes.bansos import cek_bansos_by_nik
from app.api.routes.auth import register
from app.core.security import hash_password, verify_password
from app.db.base import Base
from app.models import AuditLog, DataBansos, EligibleResident, User
from app.schemas.admin import (
    AdminWargaCreate,
    AdminWargaUpdate,
    EligibleResidentCreate,
    EligibleResidentUpdate,
    JadwalBansosCreate,
)
from app.schemas.auth import UserRegister
from app.db import init_db
from fastapi import HTTPException


def create_test_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine)()


def create_user(db, nik, role="user", **values):
    user = User(
        nik=nik,
        nama_lengkap=values.pop("nama_lengkap", f"Warga {nik}"),
        password_hash="test",
        role=role,
        **values,
    )
    db.add(user)
    db.flush()
    return user


def test_eligible_resident_updates_sync_desil_and_deactivation_preserves_account_status():
    db = create_test_session()
    try:
        admin = create_user(db, "0000000000000001", role="admin")
        resident = create_eligible_resident(
            EligibleResidentCreate(nik="3524000000000001", nama_lengkap="Warga Lama", desil=3),
            db,
            {"id_user": admin.id_user},
        )
        resident_user = create_user(
            db,
            resident["nik"],
            is_ngrowo_resident=True,
            is_verified=True,
        )
        eligible = db.query(EligibleResident).filter_by(id=resident["id"]).one()
        eligible.registered_user_id = resident_user.id_user
        db.add(
            DataBansos(
                nik_penerima=resident["nik"],
                nama_penerima="Warga Lama",
                jenis_bansos="PKH",
                periode_tahun=2026,
                status_penerima="aktif",
                rt="001",
                rw="002",
                desil=3,
            )
        )
        db.commit()

        updated = update_eligible_resident(
            resident["id"],
            EligibleResidentUpdate(nama_lengkap="Warga Baru", desil=7),
            db,
            {"id_user": admin.id_user},
        )

        db.refresh(resident_user)
        benefit = db.query(DataBansos).one()
        assert updated["nama_lengkap"] == "Warga Baru"
        assert updated["desil"] == 7
        assert resident_user.nama_lengkap == "Warga Baru"
        assert benefit.nama_penerima == "Warga Baru"
        assert benefit.desil == 7

        update_eligible_resident(
            resident["id"],
            EligibleResidentUpdate(is_active=False),
            db,
            {"id_user": admin.id_user},
        )
        db.refresh(resident_user)
        assert resident_user.is_active is False
        assert resident_user.is_ngrowo_resident is True
        assert resident_user.is_verified is True
    finally:
        db.close()
def test_admin_can_edit_resident_and_password_without_eligible_record():
    db = create_test_session()
    try:
        admin = create_user(db, "0000000000000010", role="admin")
        resident = create_user(db, "3524000000000010")
        resident.password_hash = hash_password("old-password")

        result = update_warga(
            resident.id_user,
            AdminWargaUpdate(nama_lengkap="Warga Diperbarui", password="new-password"),
            db,
            {"id_user": admin.id_user},
        )

        db.refresh(resident)
        assert result.nama_lengkap == "Warga Diperbarui"
        assert verify_password("new-password", resident.password_hash)
        assert not verify_password("old-password", resident.password_hash)
        assert db.query(AuditLog).count() == 1
        assert "Password akun juga diperbarui." in db.query(AuditLog).one().aktivitas
    finally:
        db.close()

def test_admin_cannot_edit_password_of_nonresident_account():
    db = create_test_session()
    try:
        admin = create_user(db, "0000000000000011", role="admin")
        another_admin = create_user(db, "0000000000000012", role="admin")
        original_hash = another_admin.password_hash

        try:
            update_warga(
                another_admin.id_user,
                AdminWargaUpdate(password="new-password"),
                db,
                {"id_user": admin.id_user},
            )
            assert False, "Password reset must only target resident accounts."
        except HTTPException as error:
            assert error.status_code == 404

        assert another_admin.password_hash == original_hash
        assert db.query(AuditLog).count() == 0
    finally:
        db.close()


def test_schedule_crud_persists_and_archives_without_deleting():
    db = create_test_session()
    try:
        admin = create_user(db, "0000000000000002", role="admin")
        schedule = create_jadwal_bansos(
            JadwalBansosCreate(
                program="Penyaluran PKH",
                tanggal="20 Mei 2026",
                iso_date="2026-05-20",
                jam="08.00-12.00",
                lokasi="Balai Desa",
                persyaratan=["KTP", "KK"],
            ),
            db,
            {"id_user": admin.id_user},
        )
        assert len(get_jadwal_bansos(db)) == 1

        archive_jadwal_bansos(schedule.id, db, {"id_user": admin.id_user})

        assert get_jadwal_bansos(db) == []
        assert db.query(type(schedule)).filter_by(id=schedule.id).one().is_archived is True
        assert db.query(AuditLog).count() == 2
    finally:
        db.close()


def test_bansos_lookup_is_limited_to_own_nik_and_uses_eligible_desil():
    db = create_test_session()
    try:
        user = create_user(db, "3524000000000003")
        eligible = EligibleResident(
            nik=user.nik,
            nama_lengkap=user.nama_lengkap,
            nama_normalized=user.nama_lengkap.lower(),
            registered_user_id=user.id_user,
            desil=8,
        )
        benefit = DataBansos(
            nik_penerima=user.nik,
            nama_penerima=user.nama_lengkap,
            jenis_bansos="BPNT",
            periode_tahun=2026,
            status_penerima="aktif",
            rt="001",
            rw="002",
            desil=3,
        )
        db.add_all([eligible, benefit])
        db.commit()

        result = cek_bansos_by_nik(user.nik, {"id_user": user.id_user}, db)

        assert result[0].desil == 8
        try:
            cek_bansos_by_nik("3524000000000004", {"id_user": user.id_user}, db)
            assert False, "Lookup for another resident must be rejected."
        except HTTPException as error:
            assert error.status_code == 403
    finally:
        db.close()


def test_startup_links_matching_eligible_residents_to_accounts(monkeypatch):
    db = create_test_session()
    try:
        user = create_user(
            db,
            "3524000000000005",
            is_ngrowo_resident=False,
            is_verified=False,
        )
        resident = EligibleResident(
            nik=user.nik,
            nama_lengkap=user.nama_lengkap,
            nama_normalized=user.nama_lengkap.lower(),
            desil=5,
            is_active=True,
        )
        db.add(resident)
        db.commit()
        engine = db.get_bind()
        db.close()

        monkeypatch.setattr(init_db, "SessionLocal", sessionmaker(bind=engine))
        init_db.activate_eligible_citizens()

        db = sessionmaker(bind=engine)()
        resident = db.query(EligibleResident).one()
        user = db.query(User).one()
        assert resident.registered_user_id == user.id_user
        assert user.is_ngrowo_resident is True
        assert user.is_verified is True
    finally:
        db.close()


def test_admin_create_warga_directly_and_edit_desil():
    db = create_test_session()
    try:
        admin = create_user(db, "0000000000000099", role="admin")
        created_warga = create_warga(
            AdminWargaCreate(
                nik="3524111122223333",
                nama_lengkap="Siti Aminah",
                no_kk="3524111122220000",
                no_hp="081234567890",
                rt="003",
                rw="002",
                alamat_detail="Jl. Mawar No. 10",
                desil=2,
                password="password123",
            ),
            db,
            {"id_user": admin.id_user},
        )

        assert created_warga.nik == "3524111122223333"
        assert created_warga.nama_lengkap == "Siti Aminah"
        assert created_warga.desil == 2
        assert created_warga.is_verified is False
        assert created_warga.is_ngrowo_resident is False
        assert created_warga.is_active is False

        resident_record = db.query(EligibleResident).filter_by(nik="3524111122223333").one()
        assert resident_record.desil == 2
        assert resident_record.registered_user_id == created_warga.id_user

        updated_warga = update_warga(
            created_warga.id_user,
            AdminWargaUpdate(
                desil=1,
                nama_lengkap="Siti Aminah Baru",
            ),
            db,
            {"id_user": admin.id_user},
        )

        db.refresh(resident_record)
        assert updated_warga.desil == 1
        assert resident_record.desil == 1
        assert resident_record.nama_lengkap == "Siti Aminah Baru"
    finally:
        db.close()


def test_eligible_registration_uses_admin_location_and_creates_verified_account():
    db = create_test_session()
    try:
        admin = create_user(db, "0000000000000100", role="admin")
        resident = create_eligible_resident(
            EligibleResidentCreate(
                nik="3524111122224444",
                nama_lengkap="Warga Eligible",
                rt="004",
                rw="005",
                desil=2,
            ),
            db,
            {"id_user": admin.id_user},
        )

        result = register(
            UserRegister(
                nik=resident["nik"],
                nama_lengkap="Warga Eligible",
                no_kk="3524111122220000",
                no_hp="081234567890",
                rt="999",
                rw="999",
                password="password123",
            ),
            db,
        )

        user = db.query(User).filter(User.nik == resident["nik"]).one()
        assert result["verification_status"] == "verified"
        assert user.is_ngrowo_resident is True
        assert user.is_verified is True
        assert user.rt == "004"
        assert user.rw == "005"
        assert db.query(EligibleResident).filter_by(nik=resident["nik"]).one().registered_user_id == user.id_user
    finally:
        db.close()


def test_unlisted_registration_waits_for_admin_verification():
    db = create_test_session()
    try:
        result = register(
            UserRegister(
                nik="3524111122225555",
                nama_lengkap="Warga Menunggu",
                no_kk="3524111122220000",
                no_hp="081234567890",
                rt="001",
                rw="001",
                password="password123",
            ),
            db,
        )

        user = db.query(User).filter(User.nik == "3524111122225555").one()
        assert result["verification_status"] == "pending"
        assert user.is_ngrowo_resident is False
        assert user.is_verified is False
        assert user.is_active is True
    finally:
        db.close()

