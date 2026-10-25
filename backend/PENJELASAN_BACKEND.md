# Penjelasan Backend SI-BANSOS Ngrowo

Dokumen ini menjelaskan bagian-bagian penting backend agar alur aplikasi lebih
mudah dipahami. Backend dibuat dengan **Python**, **FastAPI**, **SQLAlchemy**,
**MySQL**, dan **Google Gemini API**.

## 1. Gambaran umum

Alur komunikasi aplikasi:

```text
Frontend React
      |
      | HTTP/REST API
      v
Backend FastAPI
      |
      +--> MySQL: menyimpan data warga, bansos, pengaduan, jadwal, dan notifikasi
      |
      +--> Gemini API: menganalisis foto kondisi fisik rumah
```

Backend menerima request dari frontend, memvalidasi data, menjalankan proses
bisnis, membaca atau menyimpan data ke database, kemudian mengembalikan response
berformat JSON.

## 2. Struktur folder

```text
backend/
├── app/
│   ├── main.py                 # Pintu masuk aplikasi FastAPI
│   ├── api/
│   │   ├── deps.py             # Dependency login dan hak akses
│   │   └── routes/              # Endpoint API
│   ├── core/
│   │   ├── config.py            # Konfigurasi dari file .env
│   │   ├── gemini.py            # Prompt dan pemanggilan Gemini
│   │   ├── normalization.py     # Normalisasi nama warga
│   │   ├── security.py          # Password dan token
│   │   └── storage.py           # Lokasi dan batas ukuran upload
│   ├── db/
│   │   ├── base.py              # Base SQLAlchemy
│   │   ├── session.py           # Koneksi dan session database
│   │   └── init_db.py           # Pembuatan tabel, migrasi, dan seed
│   ├── models/                  # Bentuk tabel database
│   └── schemas/                 # Validasi bentuk request dan response
├── tests/                       # Pengujian otomatis
└── requirements.txt             # Daftar library Python
```

## 3. File utama aplikasi

### `app/main.py`

File ini menjalankan dan mengatur aplikasi FastAPI.

Tugas utamanya:

- Membuat tabel database saat aplikasi dimulai melalui `create_tables()`.
- Membuat objek aplikasi FastAPI.
- Mengatur CORS agar frontend boleh mengakses backend.
- Mendaftarkan router untuk auth, bansos, pengaduan, admin, notifikasi,
  wilayah, jadwal, dan validasi rumah.
- Menyediakan folder `/uploads` untuk file yang memang boleh diakses melalui
  URL.
- Menyediakan endpoint kesehatan `/api/health`.

Endpoint validasi rumah saat ini hanya memiliki endpoint resmi:

```text
POST /admin/validate-house
```

### `app/api/routes/`

Folder ini berisi endpoint berdasarkan fitur.

#### `auth.py`

Mengatur:

- Registrasi warga.
- Login.
- Informasi akun yang sedang login.
- Validasi NIK dan nama terhadap `eligible_residents`.
- Pencegahan pendaftaran ulang dengan NIK yang sama.
- Pembuatan token login.

Alur registrasi:

```text
Warga mengirim NIK dan nama
          |
          v
Cari NIK di eligible_residents
          |
          v
Cocokkan nama yang sudah dinormalisasi
          |
          +--> Tidak cocok: ditolak
          |
          +--> Sudah pernah terdaftar: ditolak
          |
          v
Buat akun warga dan simpan user_id pada data warga resmi
```

#### `bansos.py`

Mengatur:

- Melihat daftar penerima bansos.
- Mencari penerima berdasarkan NIK atau nama.
- Filter berdasarkan RT, RW, dan jenis bantuan.
- Cek bansos berdasarkan NIK.
- Menambah data penerima bansos oleh admin.
- Menyembunyikan sebagian NIK dan nomor KK pada response publik.

Data penerima memiliki informasi seperti:

- NIK penerima.
- Nama penerima.
- Jenis bantuan.
- Periode bantuan.
- Status penerima.
- RT/RW dan dusun.
- Desil 1 sampai 10.

Contoh endpoint:

```text
GET  /cek-bansos/{nik}
GET  /bansos/cek/{nik}
GET  /bansos/penerima
POST /bansos
```

#### `pengaduan.py`

Mengatur pengaduan warga dan proses admin terhadap pengaduan tersebut.

Data yang dapat dikirim antara lain:

- Jenis pengaduan.
- Program terkait.
- Deskripsi.
- Lokasi atau domisili.
- RT/RW.
- Bukti foto.
- Pilihan anonim.

Program `Desil Tidak Sesuai` digunakan untuk laporan yang membutuhkan
verifikasi desil atau kesesuaian penerima bantuan.

#### `admin.py`

Mengatur operasi khusus admin, seperti:

- Mengelola data warga.
- Mengelola data penerima.
- Mengelola jadwal bansos.
- Melihat dan memperbarui pengaduan.
- Mengekspor rekap pengaduan ke PDF dengan mode inline (preview tab browser).
- Melihat audit log.
- Mengimpor daftar warga resmi.

Endpoint admin dilindungi oleh dependency `get_current_admin`, sehingga warga
biasa tidak dapat menjalankan operasi admin.

#### `notifications.py`

Mengatur pengumuman dan notifikasi admin.

Notifikasi digunakan agar informasi dari admin dapat muncul di:

- Beranda warga.
- Halaman jadwal.
- Layanan notifikasi aplikasi.

#### `wilayah.py`

Mengambil data wilayah seperti RT dan RW. Data ini dipakai pada form pengaduan
dan pengelolaan domisili warga.

#### `house_validation.py`

Menerima upload foto rumah dari admin dan menjalankan penilaian awal melalui
Gemini.

Sebelum dikirim ke AI, backend memeriksa:

- MIME type foto.
- Signature atau isi awal file.
- File tidak boleh kosong.
- Ukuran maksimal 2 MB.

Jika valid, foto dan prompt dikirim ke Gemini. Hasilnya harus tetap diperiksa
secara manual oleh petugas.

## 4. Dependency keamanan dan login

### `app/api/deps.py`

Berisi dependency FastAPI yang dipasang pada endpoint tertentu, terutama:

- Mengambil user dari token login.
- Memastikan user sudah login.
- Memastikan user memiliki role admin.

### `app/core/security.py`

Berisi fungsi keamanan, biasanya meliputi:

- Hash password.
- Verifikasi password.
- Pembuatan JWT.
- Pembacaan token.

Password tidak disimpan dalam bentuk teks biasa.

## 5. Konfigurasi

### `app/core/config.py`

Mengambil konfigurasi dari file `.env`.

Contoh konfigurasi yang dibutuhkan:

```env
DATABASE_URL=mysql+pymysql://USER:PASSWORD@HOST:3306/DATABASE
SECRET_KEY=ganti_dengan_secret_key_yang_aman
GEMINI_API_KEY=isi_api_key_dari_google_ai_studio
GEMINI_MODEL=gemini-3.1-flash-lite
```

Nama environment variable dibaca oleh `pydantic-settings`. File `.env` tidak
boleh di-commit ke GitHub karena dapat berisi password database dan API key.

## 6. Database dan model

### `app/db/session.py`

Membuat engine SQLAlchemy dan session database. Setiap endpoint yang perlu
mengakses database menerima session melalui dependency `get_db`.

Pola sederhananya:

```python
def endpoint(db: Session = Depends(get_db)):
    data = db.query(Model).all()
    return data
```

### `app/models/`

Model adalah representasi tabel database.

Model penting:

- `user.py`: akun warga dan admin.
- `eligible_resident.py`: daftar warga resmi yang boleh registrasi.
- `bansos.py`: data penerima bantuan.
- `pengaduan.py`: laporan pengaduan warga.
- `notification.py`: notifikasi atau riwayat informasi admin.
- `wilayah.py`: data RT/RW/dusun.
- `audit_log.py`: catatan aktivitas penting admin.
- `fcm_device_token.py`: token perangkat untuk notifikasi Firebase.

### Data desil

Kolom `desil` disimpan pada:

- `eligible_residents`: desil setiap warga resmi.
- `data_bansos`: desil pada saat data penerima bantuan dicatat.

Rentang yang digunakan adalah 1 sampai 10. Data desil harus dipakai sebagai
informasi pendukung dan tidak boleh menjadi satu-satunya dasar keputusan tanpa
verifikasi sesuai kebijakan desa.

### `app/db/init_db.py`

File ini menjalankan:

- Pembuatan tabel yang belum ada.
- Penambahan kolom database yang belum tersedia.
- Seed admin dan data demo.
- Pengisian desil warga.
- Seed contoh penerima bansos.
- Normalisasi data nama warga.

Penting: `create_all()` tidak otomatis menambahkan kolom baru pada tabel lama.
Karena itu fungsi `ensure_desil_columns()` melakukan pemeriksaan dan migrasi
kolom `desil` secara aman saat startup.

## 7. Schema request dan response

### `app/schemas/`

Schema Pydantic digunakan untuk:

- Memvalidasi input sebelum masuk ke fungsi endpoint.
- Menentukan bentuk response API.
- Membatasi panjang, pola, dan rentang nilai.

Contoh aturan pada data bansos:

- NIK harus terdiri dari 16 angka.
- Desil harus berada pada rentang 1 sampai 10.
- Status penerima hanya boleh `aktif`, `graduasi`, atau `penangguhan`.

Perbedaan model dan schema:

```text
Model  = bentuk data di database
Schema = bentuk data yang masuk/keluar melalui API
```

## 8. Integrasi Gemini AI

### `app/core/gemini.py`

File ini berisi:

- Prompt penilaian rumah.
- Pembuatan client Gemini.
- Pengiriman prompt dan foto.
- Pembersihan response JSON.
- Validasi hasil dengan `HouseConditionAssessment`.
- Penanganan error konfigurasi dan response AI.

Prompt menggunakan pola Prompt Engineering:

1. Peran dan konteks.
2. Tugas yang jelas.
3. Batasan keamanan.
4. Format output.
5. Gaya jawaban.
6. Contoh output.

AI hanya boleh menilai kondisi fisik yang tampak pada foto:

- Atap.
- Dinding.
- Lantai.
- Struktur bangunan.

AI tidak boleh digunakan untuk:

- Mengenali identitas atau wajah.
- Menilai pendapatan dan aset.
- Menghitung jumlah penghuni.
- Menentukan secara final kelayakan bantuan.

Hasil AI wajib memiliki `manual_review_required: true`.

## 9. Error handling Gemini

Beberapa error yang digunakan:

- `GeminiNotConfiguredError`: API key belum tersedia.
- `GeminiAssessmentError`: Gemini gagal memberikan hasil yang valid.
- `ValidationError`: response tidak sesuai schema JSON.

Endpoint mengubah error tersebut menjadi HTTP response yang dapat dipahami
frontend, misalnya:

- `503`: Gemini belum dikonfigurasi.
- `502`: Gemini gagal menilai foto.
- `400`: file foto tidak valid.
- `413`: ukuran foto terlalu besar.

## 10. Testing

Folder `backend/tests/` berisi pengujian untuk:

- API bansos publik.
- Validasi foto rumah dan parsing response Gemini.
- Profile dan notifikasi.

Contoh menjalankan test jika `pytest` tersedia:

```powershell
cd C:\xampp\htdocs\si-bansos-ngrowo\backend
python -m pytest
```

Pengecekan syntax sederhana:

```powershell
cd C:\xampp\htdocs\si-bansos-ngrowo\backend
python -m compileall -q app tests
```

## 11. Menjalankan backend

### Dengan Python

```powershell
cd C:\xampp\htdocs\si-bansos-ngrowo\backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Dengan Docker

Dari root project:

```powershell
cd C:\xampp\htdocs\si-bansos-ngrowo
docker compose up -d
```

Dokumentasi API dapat dibuka pada:

```text
http://localhost:8000/docs
```

OpenAPI JSON:

```text
http://localhost:8000/openapi.json
```

## 12. Cara membaca satu request

Contoh alur cek bansos:

```text
Frontend mengirim GET /cek-bansos/{nik}
        |
        v
Route bansos.py menerima NIK
        |
        v
SQLAlchemy mencari NIK pada tabel data_bansos
        |
        v
Data NIK dan KK disamarkan
        |
        v
Schema response memvalidasi hasil
        |
        v
Frontend menerima JSON dan menampilkannya
```

Contoh alur validasi rumah:

```text
Admin upload foto
        |
        v
Endpoint memeriksa tipe, isi, dan ukuran file
        |
        v
Prompt + foto dikirim ke Gemini API
        |
        v
Response dibersihkan dan divalidasi sebagai JSON
        |
        v
Hasil dikembalikan ke frontend
        |
        v
Petugas tetap melakukan verifikasi manual
```

## 13. Catatan keamanan

- Jangan membagikan `GEMINI_API_KEY`.
- Jangan membagikan password database.
- Jangan memasukkan `.env` ke commit.
- Jangan menampilkan NIK dan nomor KK lengkap kepada publik.
- Batasi akses endpoint admin dengan dependency role admin.
- Hasil AI harus dianggap sebagai bantuan awal, bukan keputusan otomatis.
- File upload harus divalidasi tipe, ukuran, dan isinya.
