from datetime import datetime
from io import BytesIO
import random
import string
from typing import Any, List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.bansos import DataBansos
from app.models.eligible_resident import EligibleResident
from app.models.pengaduan import PengaduanBansos
from app.models.user import User
from app.schemas.auth import UserProfileUpdate, UserResponse
from app.schemas.pengaduan import (
    PengaduanAdminCreate,
    PengaduanAdminUpdate,
    PengaduanResponse,
)

router = APIRouter()


class AdminPasswordReset(BaseModel):
    password_baru: str
    konfirmasi_password: str


class AdminWargaUpdate(UserProfileUpdate):
    pass


# ==========================================
# MANAJEMEN JADWAL PENYALURAN BANSOS
# ==========================================
BULAN_ID = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

in_memory_jadwal: List[dict] = []


def _format_tanggal_indonesia(value: datetime | None) -> str:
    if not value:
        return "-"
    bulan_id = [
        "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ]
    return f"{value.day:02d} {bulan_id[value.month]} {value.year}"


def generate_default_dynamic_jadwal():
    now = datetime.now()
    curr_month_name = BULAN_ID[now.month]
    curr_year = now.year
    next_month_idx = now.month + 1 if now.month < 12 else 1
    next_month_year = curr_year if now.month < 12 else curr_year + 1
    next_month_name = BULAN_ID[next_month_idx]

    return [
        {
            "id": 1,
            "program": "Bansos Beras CPP 10 Kg",
            "tanggal": f"15 {curr_month_name} {curr_year}",
            "iso_date": f"{curr_year}-{now.month:02d}-15",
            "jam": "08:30 - 14:00 WIB",
            "lokasi": "Pendopo Balai Desa Ngrowo",
            "status": "Akan Datang",
            "persyaratan": ["KTP Asli Penerima", "Kartu Keluarga Asli", "Undangan Ber-Barcode dari RT"],
        },
        {
            "id": 2,
            "program": f"BLT Dana Desa ({curr_month_name} {curr_year})",
            "tanggal": f"24 {curr_month_name} {curr_year}",
            "iso_date": f"{curr_year}-{now.month:02d}-24",
            "jam": "09:00 - 12:00 WIB",
            "lokasi": "Ruang Pelayanan Kantor Kelurahan Ngrowo",
            "status": "Dijadwalkan",
            "persyaratan": ["KTP Asli", "Fotokopi KK 1 Lembar"],
        },
        {
            "id": 3,
            "program": "Penyaluran BPNT Sembako",
            "tanggal": f"05 {next_month_name} {next_month_year}",
            "iso_date": f"{next_month_year}-{next_month_idx:02d}-05",
            "jam": "08:00 - 15:00 WIB",
            "lokasi": "E-Warong Amanah Makmur Ngrowo",
            "status": "Persiapan",
            "persyaratan": ["KKS (Kartu Keluarga Sejahtera)", "KTP Elektronik"],
        },
    ]


class JadwalBansosCreate(BaseModel):
    id: Optional[int] = None
    program: str
    tanggal: str
    jam: str
    lokasi: str
    status: Optional[str] = "Dijadwalkan"
    persyaratan: Optional[Union[List[str], str]] = []
    iso_date: Optional[str] = None


@router.get("/jadwal")
def get_jadwal_bansos():
    base = generate_default_dynamic_jadwal()
    if in_memory_jadwal:
        return in_memory_jadwal + base
    return base


@router.post("/jadwal")
def create_jadwal_bansos(
    data: JadwalBansosCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    new_id = len(in_memory_jadwal) + 10
    item = data.dict() if hasattr(data, "dict") else data.model_dump()
    item["id"] = new_id
    if isinstance(item.get("persyaratan"), str):
        item["persyaratan"] = [p.strip() for p in item["persyaratan"].split(",") if p.strip()]
    in_memory_jadwal.insert(0, item)

    admin_id = current_admin.get("id_user") if isinstance(current_admin, dict) else 1
    db.add(
        AuditLog(
            id_user=admin_id,
            aktivitas=f"Admin menambahkan jadwal bansos baru: {data.program} pada {data.tanggal}",
        )
    )
    db.commit()
    return item


@router.put("/jadwal/{jadwal_id}")
def update_jadwal_bansos(
    jadwal_id: int,
    data: JadwalBansosCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    item = next((entry for entry in in_memory_jadwal if entry.get("id") == jadwal_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan atau merupakan jadwal bawaan.")
    updates = data.model_dump() if hasattr(data, "model_dump") else data.dict()
    updates["id"] = jadwal_id
    if isinstance(updates.get("persyaratan"), str):
        updates["persyaratan"] = [p.strip() for p in updates["persyaratan"].split(",") if p.strip()]
    item.update(updates)
    admin_id = current_admin.get("id_user") if isinstance(current_admin, dict) else 1
    db.add(AuditLog(id_user=admin_id, aktivitas=f"Admin memperbarui jadwal bansos: {data.program}"))
    db.commit()
    return item


@router.delete("/jadwal/{jadwal_id}")
def delete_jadwal_bansos(
    jadwal_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    index = next((index for index, entry in enumerate(in_memory_jadwal) if entry.get("id") == jadwal_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan atau merupakan jadwal bawaan.")
    deleted = in_memory_jadwal.pop(index)
    admin_id = current_admin.get("id_user") if isinstance(current_admin, dict) else 1
    db.add(AuditLog(id_user=admin_id, aktivitas=f"Admin menghapus jadwal bansos: {deleted.get('program', '-') }"))
    db.commit()
    return {"status": "success", "message": "Jadwal berhasil dihapus."}


# ==========================================
# KELOLA & VERIFIKASI WARGA
# ==========================================
@router.get("/warga", response_model=List[UserResponse])
def get_warga_terdaftar(
    db: Session = Depends(get_db),
    _current_admin=Depends(get_current_admin),
):
    return (
        db.query(User)
        .filter(User.role.in_(["user", "warga"]))
        .order_by(User.created_at.desc())
        .all()
    )


@router.put("/warga/{id_user}", response_model=UserResponse)
def update_warga(
    id_user: int,
    profile: AdminWargaUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    user = db.query(User).filter(User.id_user == id_user, User.role.in_(["user", "warga"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="Data warga tidak ditemukan.")
    for field, value in profile.model_dump(exclude_unset=True).items():
        if field == "password":
            user.password_hash = hash_password(value)
        else:
            setattr(user, field, value.strip() if isinstance(value, str) else value)
    db.add(AuditLog(
        id_user=current_admin.get("id_user"),
        aktivitas=f"Admin memperbarui data warga: {user.nama_lengkap} (NIK: {user.nik})",
    ))
    db.commit()
    db.refresh(user)
    return user


@router.put("/warga/{id_user}/password")
def reset_password_warga(
    id_user: int,
    data: AdminPasswordReset,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    if len(data.password_baru) < 6 or len(data.password_baru.encode("utf-8")) > 72:
        raise HTTPException(status_code=422, detail="Password warga harus 6 sampai 72 byte.")
    if data.password_baru != data.konfirmasi_password:
        raise HTTPException(status_code=422, detail="Konfirmasi password tidak sama.")
    user = db.query(User).filter(User.id_user == id_user, User.role.in_(["user", "warga"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="Data warga tidak ditemukan.")
    user.password_hash = hash_password(data.password_baru)
    db.add(AuditLog(
        id_user=current_admin.get("id_user"),
        aktivitas=f"Admin mereset password warga: {user.nama_lengkap} (NIK: {user.nik})",
    ))
    db.commit()
    return {"status": "success", "message": "Password warga berhasil diperbarui."}


@router.delete("/warga/{id_user}")
def delete_warga(
    id_user: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    user = db.query(User).filter(User.id_user == id_user, User.role.in_(["user", "warga"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="Data warga tidak ditemukan.")
    nama, nik = user.nama_lengkap, user.nik
    db.add(AuditLog(
        id_user=current_admin.get("id_user"),
        aktivitas=f"Admin menghapus akun warga: {nama} (NIK: {nik})",
    ))
    db.delete(user)
    db.commit()
    return {"status": "success", "message": "Akun warga berhasil dihapus."}


@router.put("/profile/{id_user}", response_model=UserResponse)
def update_admin_profile(
    id_user: int,
    profile: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    if id_user != current_admin.get("id_user"):
        raise HTTPException(status_code=403, detail="Admin hanya dapat memperbarui profil sendiri.")
    user = db.query(User).filter(User.id_user == id_user, User.role == "admin").first()
    if not user:
        raise HTTPException(status_code=404, detail="Profil admin tidak ditemukan!")
    for field, value in profile.model_dump(exclude_unset=True).items():
        if field == "password":
            user.password_hash = hash_password(value)
        else:
            setattr(user, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(user)
    return user


@router.get("/pending-warga", response_model=List[UserResponse])
def get_pending_warga(
    db: Session = Depends(get_db),
    _current_admin=Depends(get_current_admin),
):
    return (
        db.query(User)
        .filter(
            User.role.in_(["user", "warga"]),
            (User.is_ngrowo_resident == False) | (User.is_verified == False),
        )
        .order_by(User.created_at.desc())
        .all()
    )


@router.put("/approve-warga/{id_user}")
@router.post("/approve-warga/{id_user}")
@router.put("/verifikasi-warga/{id_user}")
@router.post("/verifikasi-warga/{id_user}")
@router.put("/verifikasi/{id_user}")
@router.post("/verifikasi/{id_user}")
def approve_warga(
    id_user: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    user = db.query(User).filter(User.id_user == id_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="Data warga tidak ditemukan!")

    user.is_ngrowo_resident = True
    user.is_verified = True
    eligible_resident = db.query(EligibleResident).filter(EligibleResident.nik == user.nik).first()
    if eligible_resident and eligible_resident.registered_user_id is None:
        eligible_resident.registered_user_id = user.id_user
    db.commit()
    db.refresh(user)

    admin_id = current_admin.get("id_user") if isinstance(current_admin, dict) else 1
    db.add(
        AuditLog(
            id_user=admin_id,
            aktivitas=f"Admin menyetujui verifikasi warga: {user.nama_lengkap} (NIK: {user.nik})",
        )
    )
    db.commit()
    return {"status": "success", "message": f"Warga {user.nama_lengkap} berhasil diverifikasi sebagai penduduk Ngrowo."}


@router.put("/reject-warga/{id_user}")
@router.post("/reject-warga/{id_user}")
@router.delete("/reject-warga/{id_user}")
@router.put("/tolak-warga/{id_user}")
@router.post("/tolak-warga/{id_user}")
def reject_warga(
    id_user: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    user = db.query(User).filter(User.id_user == id_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="Data warga tidak ditemukan!")

    nama = user.nama_lengkap
    nik = user.nik
    admin_id = current_admin.get("id_user") if isinstance(current_admin, dict) else 1
    db.add(
        AuditLog(
            id_user=admin_id,
            aktivitas=f"Admin menolak registrasi warga non-Ngrowo: {nama} (NIK: {nik})",
        )
    )
    db.delete(user)
    db.commit()
    return {"status": "success", "message": f"Pendaftaran warga {nama} ditolak dan dihapus dari sistem."}


# ==========================================
# PENGADUAN & AUDIT LOGS
# ==========================================
@router.get("/pengaduan", response_model=List[PengaduanResponse])
def get_semua_pengaduan(
    rt: str | None = Query(default=None),
    rw: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _current_admin=Depends(get_current_admin),
):
    query = db.query(PengaduanBansos).join(User, PengaduanBansos.id_user == User.id_user)
    if rt:
        query = query.filter(User.rt == rt)
    if rw:
        query = query.filter(User.rw == rw)
    reports = query.order_by(PengaduanBansos.created_at.desc()).all()
    responses = []
    for report in reports:
        target_nik = report.nik_terlapor
        if not target_nik and report.pelapor:
            target_nik = report.pelapor.nik
        resident = (
            db.query(EligibleResident)
            .filter(EligibleResident.nik == target_nik)
            .first()
            if target_nik
            else None
        )
        response = PengaduanResponse.model_validate(report)
        response.desil = resident.desil if resident else None
        responses.append(response)
    return responses


@router.get("/pengaduan/rekap-pdf")
def export_rekap_pengaduan_pdf(
    rt: str | None = Query(default=None),
    rw: str | None = Query(default=None),
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _current_admin=Depends(get_current_admin),
):
    query = (
        db.query(PengaduanBansos)
        .join(User, PengaduanBansos.id_user == User.id_user)
        .options(joinedload(PengaduanBansos.pelapor))
    )

    if rt:
        query = query.filter(User.rt == rt)
    if rw:
        query = query.filter(User.rw == rw)
    if status:
        query = query.filter(PengaduanBansos.status_laporan == status)
    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                PengaduanBansos.nomor_tiket.ilike(keyword),
                PengaduanBansos.nik_terlapor.ilike(keyword),
                PengaduanBansos.kategori_aduan.ilike(keyword),
                PengaduanBansos.program_terkait.ilike(keyword),
                PengaduanBansos.deskripsi_kejadian.ilike(keyword),
                User.nama_lengkap.ilike(keyword),
            )
        )

    records = query.order_by(PengaduanBansos.created_at.desc()).all()

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=1.2 * cm,
        leftMargin=1.2 * cm,
        topMargin=1.3 * cm,
        bottomMargin=1.3 * cm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleCenter",
        parent=styles["Heading2"],
        alignment=1,
        fontName="Helvetica-Bold",
        leading=16,
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "SubtitleCenter",
        parent=styles["Normal"],
        alignment=1,
        leading=13,
        spaceAfter=3,
    )
    normal_small = ParagraphStyle(
        "NormalSmall",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
    )

    elements = [
        Paragraph("PEMERINTAH DESA NGROWO", title_style),
        Paragraph("KECAMATAN BANGSAL - KABUPATEN MOJOKERTO", subtitle_style),
        Paragraph("Jl. Raya Ngrowo No. 10, Telp. (0321) 000000", subtitle_style),
        Spacer(1, 6),
        Table(
            [[""]],
            colWidths=[27.3 * cm],
            style=TableStyle([("LINEABOVE", (0, 0), (-1, -1), 1.3, colors.black)]),
        ),
        Spacer(1, 8),
        Paragraph("REKAP LAPORAN PENGADUAN & SANGGAHAN BANSOS", title_style),
        Paragraph(
            f"Tanggal Cetak: {_format_tanggal_indonesia(datetime.now())}",
            ParagraphStyle("PrintDate", parent=styles["Normal"], alignment=1, fontSize=9),
        ),
        Spacer(1, 8),
    ]

    info_filter = [
        f"RT: {rt or 'Semua'}",
        f"RW: {rw or 'Semua'}",
        f"Status: {status or 'Semua'}",
    ]
    elements.append(Paragraph("Filter Aktif: " + " | ".join(info_filter), normal_small))
    elements.append(Spacer(1, 6))

    table_header = [
        "No", "No. Tiket", "Tanggal", "Pelapor", "NIK Terlapor", "Kategori", "Program", "Wilayah", "Status", "Catatan Admin",
    ]
    cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontSize=8,
        leading=9.5,
        alignment=1,
    )
    table_data: List[list[Any]] = [[
        Paragraph(f"<b>{header}</b>", cell_style) for header in table_header
    ]]
    for idx, item in enumerate(records, start=1):
        pelapor = item.pelapor
        pelapor_nama = "Anonim" if item.is_anonymous else (pelapor.nama_lengkap if pelapor else f"User #{item.id_user}")
        rt_val = getattr(pelapor, "rt", None) or "-"
        rw_val = getattr(pelapor, "rw", None) or "-"
        wilayah = f"RT {rt_val}/RW {rw_val}"
        table_data.append([
            Paragraph(str(idx), cell_style),
            Paragraph(item.nomor_tiket or "-", cell_style),
            Paragraph(_format_tanggal_indonesia(item.created_at), cell_style),
            Paragraph(pelapor_nama, cell_style),
            Paragraph(item.nik_terlapor or "-", cell_style),
            Paragraph(item.kategori_aduan or "-", cell_style),
            Paragraph(item.program_terkait or "-", cell_style),
            Paragraph(wilayah, cell_style),
            Paragraph(item.status_laporan or "-", cell_style),
            Paragraph(item.catatan_admin or "-", cell_style),
        ])

    if len(table_data) == 1:
        table_data.append([
            Paragraph(value, cell_style)
            for value in ["-", "-", "-", "Tidak ada data pengaduan", "-", "-", "-", "-", "-", "-"]
        ])

    report_table = Table(
        table_data,
        colWidths=[0.7 * cm, 3.2 * cm, 2.3 * cm, 3.0 * cm, 2.4 * cm, 3.0 * cm, 2.7 * cm, 4.1 * cm, 2.0 * cm, 3.9 * cm],
        repeatRows=1,
    )
    report_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
            ("WORDWRAP", (0, 0), (-1, -1), True),
        ])
    )
    elements.append(report_table)
    elements.append(Spacer(1, 18))

    ttd_table = Table(
        [[
            Paragraph(
                "Mengetahui,<br/>Sekretaris Desa Ngrowo<br/><br/><br/><u>....................................</u>",
                ParagraphStyle("Sig", parent=styles["Normal"], alignment=1, leading=14),
            ),
            Paragraph(
                f"Ngrowo, {_format_tanggal_indonesia(datetime.now())}<br/>Kepala Desa Ngrowo<br/><br/><br/><u>....................................</u>",
                ParagraphStyle("Sig2", parent=styles["Normal"], alignment=1, leading=14),
            ),
        ]],
        colWidths=[9.0 * cm, 9.0 * cm],
    )
    ttd_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(ttd_table)

    doc.build(elements)
    buffer.seek(0)
    filename = f"Rekap_Pengaduan_Ngrowo_{datetime.now().strftime('%Y-%m-%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()


@router.get("/audit-logs/rekap-pdf")
def export_rekap_audit_pdf(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _current_admin=Depends(get_current_admin),
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(500).all()
    keyword = (search or "").strip().lower()

    def category_for(activity: str) -> str:
        text = (activity or "").lower()
        if any(value in text for value in ("status", "laporan", "tiket")):
            return "Pengaduan"
        if any(value in text for value in ("warga", "registrasi", "verifikasi")):
            return "Warga"
        if any(value in text for value in ("notifikasi", "broadcast")):
            return "Notifikasi"
        return "Sistem"

    records = []
    for log in logs:
        log_category = category_for(log.aktivitas)
        searchable = f"{log.aktivitas or ''} {log.id_user or ''} {log.timestamp or ''}".lower()
        if category and category.lower() != "all" and log_category.lower() != category.lower():
            continue
        if keyword and keyword not in searchable:
            continue
        records.append((log, log_category))

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=1.2 * cm,
        leftMargin=1.2 * cm,
        topMargin=1.3 * cm,
        bottomMargin=1.3 * cm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("AuditTitle", parent=styles["Heading2"], alignment=1, fontName="Helvetica-Bold", leading=16)
    subtitle_style = ParagraphStyle("AuditSubtitle", parent=styles["Normal"], alignment=1, fontSize=9, leading=12)
    cell_style = ParagraphStyle("AuditCell", parent=styles["Normal"], fontSize=8, leading=9.5)
    elements = [
        Paragraph("PEMERINTAH DESA NGROWO", title_style),
        Paragraph("CATATAN REKAM JEJAK (AUDIT LOG)", title_style),
        Paragraph(f"Tanggal Cetak: {_format_tanggal_indonesia(datetime.now())}", subtitle_style),
        Spacer(1, 8),
        Paragraph(
            f"Filter Aktif: Kategori {category or 'Semua'} | Pencarian {search or 'Semua'}",
            cell_style,
        ),
        Spacer(1, 6),
    ]
    table_data = [[
        Paragraph("No", cell_style),
        Paragraph("ID Log", cell_style),
        Paragraph("Waktu Aktivitas", cell_style),
        Paragraph("Kategori", cell_style),
        Paragraph("Pelaksana / User", cell_style),
        Paragraph("Uraian Tindakan / Kejadian", cell_style),
    ]]
    for index, (log, log_category) in enumerate(records, start=1):
        waktu = log.timestamp.strftime("%d-%m-%Y %H:%M:%S") if log.timestamp else "-"
        table_data.append([
            Paragraph(str(index), cell_style),
            Paragraph(f"#{log.id_log}", cell_style),
            Paragraph(waktu, cell_style),
            Paragraph(log_category, cell_style),
            Paragraph(f"Perangkat #{log.id_user}" if log.id_user else "Sistem / Admin", cell_style),
            Paragraph(log.aktivitas or "-", cell_style),
        ])
    if len(table_data) == 1:
        table_data.append([Paragraph(value, cell_style) for value in ["-", "-", "-", "-", "-", "Tidak ada data audit"]])

    report_table = Table(table_data, colWidths=[1.0 * cm, 1.8 * cm, 4.0 * cm, 3.0 * cm, 4.0 * cm, 12.0 * cm], repeatRows=1)
    report_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (3, -1), "CENTER"),
    ]))
    elements.append(report_table)
    doc.build(elements)
    buffer.seek(0)
    filename = f"Rekap_Audit_Log_Ngrowo_{datetime.now().strftime('%Y-%m-%d')}.pdf"
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="{filename}"'})


def _generate_nomor_tiket() -> str:
    tanggal = datetime.now().strftime("%Y%m%d")
    acak = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"ADU-{tanggal}-{acak}"


def _update_desil_for_nik(db: Session, nik: str, desil: int) -> None:
    resident = db.query(EligibleResident).filter(EligibleResident.nik == nik).first()
    if resident:
        resident.desil = desil

    db.query(DataBansos).filter(DataBansos.nik_penerima == nik).update(
        {"desil": desil},
        synchronize_session=False,
    )


def _get_pengaduan_target_nik(
    db: Session,
    pengaduan: PengaduanBansos,
    data_update: PengaduanAdminUpdate,
) -> str | None:
    if data_update.nik_penerima:
        return data_update.nik_penerima
    if pengaduan.nik_terlapor:
        return pengaduan.nik_terlapor
    pelapor = db.query(User).filter(User.id_user == pengaduan.id_user).first()
    return pelapor.nik if pelapor else None


def _apply_bantuan_from_pengaduan(db: Session, pengaduan: PengaduanBansos, data_update: PengaduanAdminUpdate):
    """Tetapkan warga sebagai penerima bantuan + desil saat laporan disetujui."""
    if data_update.desil is None:
        return None

    pelapor = db.query(User).filter(User.id_user == pengaduan.id_user).first()
    target_nik = data_update.nik_penerima or pengaduan.nik_terlapor or (pelapor.nik if pelapor else None)
    if not target_nik:
        return None

    target_user = db.query(User).filter(User.nik == target_nik).first()
    nama = target_user.nama_lengkap if target_user else (pelapor.nama_lengkap if pelapor else "Warga Ngrowo")
    no_kk = target_user.no_kk if target_user else (pelapor.no_kk if pelapor else None)
    rt = (target_user.rt if target_user else None) or (pelapor.rt if pelapor else None) or "-"
    rw = (target_user.rw if target_user else None) or (pelapor.rw if pelapor else None) or "-"
    jenis = data_update.jenis_bansos or pengaduan.program_terkait or "Bantuan Sosial"
    periode = data_update.periode_tahun or datetime.now().year

    existing = (
        db.query(DataBansos)
        .filter(
            DataBansos.nik_penerima == target_nik,
            DataBansos.jenis_bansos == jenis,
            DataBansos.periode_tahun == periode,
        )
        .first()
    )
    if existing:
        existing.status_penerima = "aktif"
        existing.desil = data_update.desil
        existing.rt = rt
        existing.rw = rw
    else:
        db.add(
            DataBansos(
                nik_penerima=target_nik,
                nama_penerima=nama,
                no_kk=no_kk,
                jenis_bansos=jenis,
                periode_tahun=periode,
                status_penerima="aktif",
                rt=rt,
                rw=rw,
                desil=data_update.desil,
            )
        )
    _update_desil_for_nik(db, target_nik, data_update.desil)
    return {"jenis_bansos": jenis, "desil": data_update.desil, "periode_tahun": periode, "nik": target_nik}


@router.post("/pengaduan", response_model=PengaduanResponse, status_code=201)
def create_pengaduan_admin(
    data: PengaduanAdminCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    user = db.query(User).filter(User.id_user == data.id_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="Data warga pelapor tidak ditemukan!")

    tiket = _generate_nomor_tiket()
    while db.query(PengaduanBansos).filter(PengaduanBansos.nomor_tiket == tiket).first():
        tiket = _generate_nomor_tiket()

    pengaduan = PengaduanBansos(
        nomor_tiket=tiket,
        id_user=data.id_user,
        nik_terlapor=data.nik_terlapor,
        kategori_aduan=data.kategori_aduan,
        program_terkait=data.program_terkait or "Umum",
        deskripsi_kejadian=data.deskripsi_kejadian,
        lokasi_spesifik=data.lokasi_spesifik,
        bukti_foto=data.bukti_foto,
        is_anonymous=bool(data.is_anonymous),
        status_laporan=data.status_laporan or "pending",
        catatan_admin=data.catatan_admin,
    )
    db.add(pengaduan)
    db.add(
        AuditLog(
            id_user=current_admin.get("id_user") if isinstance(current_admin, dict) else 1,
            aktivitas=f"Admin menambahkan pengaduan baru {tiket} untuk {user.nama_lengkap}",
        )
    )
    db.commit()
    db.refresh(pengaduan)
    return pengaduan


@router.put("/pengaduan/{id_laporan}", response_model=PengaduanResponse)
def update_status_pengaduan(
    id_laporan: int,
    data_update: PengaduanAdminUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    pengaduan = db.query(PengaduanBansos).filter(PengaduanBansos.id_laporan == id_laporan).first()
    if not pengaduan:
        raise HTTPException(status_code=404, detail="Data pengaduan tidak ditemukan!")

    payload = data_update.model_dump(exclude_unset=True)
    editable_fields = (
        "nik_terlapor",
        "kategori_aduan",
        "program_terkait",
        "deskripsi_kejadian",
        "lokasi_spesifik",
        "bukti_foto",
        "is_anonymous",
        "status_laporan",
        "catatan_admin",
    )
    for field in editable_fields:
        if field in payload and payload[field] is not None:
            setattr(pengaduan, field, payload[field])

    bantuan_info = None
    if data_update.desil is not None:
        target_nik = _get_pengaduan_target_nik(db, pengaduan, data_update)
        if target_nik:
            _update_desil_for_nik(db, target_nik, data_update.desil)
            db.add(
                AuditLog(
                    id_user=current_admin.get("id_user") if isinstance(current_admin, dict) else 1,
                    aktivitas=f"Admin memperbarui Desil {target_nik} menjadi {data_update.desil} "
                    f"melalui pengaduan {pengaduan.nomor_tiket}",
                )
            )
    if pengaduan.status_laporan == "selesai":
        bantuan_info = _apply_bantuan_from_pengaduan(db, pengaduan, data_update)

    db.add(
        AuditLog(
            id_user=current_admin.get("id_user") if isinstance(current_admin, dict) else 1,
            aktivitas=f"Memperbarui pengaduan {pengaduan.nomor_tiket}: status {pengaduan.status_laporan}",
        )
    )

    db.commit()
    db.refresh(pengaduan)
    try:
        from app.api.routes.notifications import send_automatic_notification_to_user

        if bantuan_info:
            send_automatic_notification_to_user(
                db=db,
                id_user=pengaduan.id_user,
                title="Selamat! Anda Ditetapkan Menerima Bantuan",
                body=(
                    f"Laporan {pengaduan.nomor_tiket} telah disetujui. Anda terdaftar sebagai penerima "
                    f"{bantuan_info['jenis_bansos']} periode {bantuan_info['periode_tahun']} "
                    f"dengan Desil {bantuan_info['desil']}."
                ),
            )
        else:
            note = f" Catatan petugas: {data_update.catatan_admin}" if data_update.catatan_admin else ""
            send_automatic_notification_to_user(
                db=db,
                id_user=pengaduan.id_user,
                title="Pembaruan Status Pengaduan Bansos",
                body=f"Laporan {pengaduan.nomor_tiket} berstatus '{pengaduan.status_laporan}'.{note}",
            )
    except Exception:
        pass
    return pengaduan


@router.delete("/pengaduan/{id_laporan}")
def delete_pengaduan(
    id_laporan: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    pengaduan = db.query(PengaduanBansos).filter(PengaduanBansos.id_laporan == id_laporan).first()
    if not pengaduan:
        raise HTTPException(status_code=404, detail="Data pengaduan tidak ditemukan!")

    tiket = pengaduan.nomor_tiket
    db.delete(pengaduan)
    db.add(
        AuditLog(
            id_user=current_admin.get("id_user") if isinstance(current_admin, dict) else 1,
            aktivitas=f"Admin menghapus pengaduan {tiket}",
        )
    )
    db.commit()
    return {"status": "success", "message": f"Laporan {tiket} berhasil dihapus."}
