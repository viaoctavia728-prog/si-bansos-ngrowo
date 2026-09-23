from database import SessionLocal, engine
import models

# Membuat tabel secara otomatis jika belum ada
models.Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    try:
        # 1. Tambah Akun Admin Desa
        if not db.query(models.User).filter(models.User.nik == "3524000000000001").first():
            admin = models.User(
                nik="3524000000000001",
                nama_lengkap="Admin Desa Ngrowo",
                username="admin_ngrowo",
                password_hash="admin123",
                role="admin",
                rt="001",
                rw="001"
            )
            db.add(admin)

        # 2. Tambah Master Data Wilayah Ngrowo
        if db.query(models.WilayahNgrowo).count() == 0:
            wilayah_list = [
                models.WilayahNgrowo(dusun="Dusun Krajan", rt="001", rw="001", nama_ketua_rt="Pak Sutrisno"),
                models.WilayahNgrowo(dusun="Dusun Krajan", rt="002", rw="001", nama_ketua_rt="Pak Budi"),
                models.WilayahNgrowo(dusun="Dusun Ngrowo Timur", rt="001", rw="002", nama_ketua_rt="Pak Bambang"),
            ]
            db.add_all(wilayah_list)

        # 3. Tambah Data Penerima Bansos Sampel
        if db.query(models.DataBansos).count() == 0:
            bansos_list = [
                models.DataBansos(
                    nik_penerima="3524011111110001",
                    nama_penerima="Siti Aminah",
                    no_kk="3524011111119999",
                    jenis_bansos="PKH",
                    periode_tahun=2026,
                    status_penerima="aktif",
                    rt="001",
                    rw="001",
                    dusun="Dusun Krajan"
                ),
                models.DataBansos(
                    nik_penerima="3524012222220002",
                    nama_penerima="Budi Santoso",
                    no_kk="3524012222229999",
                    jenis_bansos="BPNT",
                    periode_tahun=2026,
                    status_penerima="aktif",
                    rt="002",
                    rw="001",
                    dusun="Dusun Krajan"
                ),
                models.DataBansos(
                    nik_penerima="3524013333330003",
                    nama_penerima="Karto Suwiryo",
                    no_kk="3524013333339999",
                    jenis_bansos="BLT Desa",
                    periode_tahun=2026,
                    status_penerima="aktif",
                    rt="001",
                    rw="002",
                    dusun="Dusun Ngrowo Timur"
                ),
            ]
            db.add_all(bansos_list)

        db.commit()
        print("✅ Data seeding berhasil dimasukkan ke database!")
    except Exception as e:
        db.rollback()
        print(f"❌ Gagal seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()