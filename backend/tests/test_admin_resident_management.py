from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.routes.admin import (
    archive_jadwal_bansos,
    create_eligible_resident,
    create_jadwal_bansos,
    get_jadwal_bansos,
    update_eligible_resident,
)
from app.api.routes.bansos import cek_bansos_by_nik
from app.db.base import Base
from app.models import AuditLog, DataBansos, EligibleResident, User
from app.schemas.admin import (
    EligibleResidentCreate,
    EligibleResidentUpdate,
    JadwalBansosCreate,
)
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
