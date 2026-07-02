# HIMATEKKOM Gunadarma — Website v2

Website resmi Himpunan Mahasiswa Teknik Komputer Universitas Gunadarma, dengan **panel admin** untuk mengelola konten (Informasi/Pengumuman, Program Kerja, Struktur Pengurus) tanpa perlu edit kode.

## ✨ Fitur

**Untuk Visitor (belum login):**
- Lihat semua halaman publik (Beranda, Proker, Informasi, Struktur, Tentang)
- Lihat FAQ (pertanyaan yang sudah dijawab admin) di halaman Tanya Jawab, dan bisa ikut bertanya (isi nama+email manual)
- Lonceng notifikasi menampilkan info terbaru yang belum dilihat (disimpan per-browser)

**Untuk User (login/daftar):**
- Daftar/login pakai email+password, atau **Login dengan Google** (avatar otomatis diambil dari foto profil Google)
- Halaman **Profil Saya**: lihat & edit nama, ganti password (kalau daftar via email), riwayat pertanyaan yang pernah diajukan beserta status & jawabannya
- Bertanya tanpa perlu isi ulang nama/email (otomatis terisi dari akun)

**Untuk Admin:**
- Semua hak akses User, ditambah **Panel Admin** (`/admin`):
  - CRUD Informasi & Pengumuman, Program Kerja, Struktur Pengurus (dengan upload gambar)
  - Tab **Pertanyaan**: lihat semua pertanyaan masuk (badge menunjukkan jumlah yang belum dijawab), jawab langsung — otomatis tampil sebagai FAQ publik
- Login admin bisa lewat email/password biasa atau Google (kalau email Google-nya di-set sebagai `ADMIN_EMAIL` di `.env`)

## ⚠️ Peringatan Keamanan (baca sebelum lanjut)

Project lama (`HIMATEKKOM_UG-main`) menyertakan file `credentials.json` berisi **private key asli** Google Service Account. Kalau file itu pernah ter-*push* ke repo publik (GitHub dsb):

1. Segera buka [Google Cloud Console → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts), cari akun `sheet-connector@inner-chassis-454509-i6.iam.gserviceaccount.com`, lalu **hapus/nonaktifkan key tersebut**.
2. Riwayat git tetap menyimpan file itu meski dihapus di commit terbaru — kalau repo publik, anggap key sudah bocor permanen dan wajib direvoke.
3. Data di `hima.json` (nama, NPM, email, no. HP pendaftar) juga sebaiknya **tidak** ikut di-commit ke repo publik ke depannya — itu data pribadi.

Project baru ini **tidak** menyertakan credential apa pun. Semua rahasia (session secret, password admin awal) diatur lewat file `.env` yang di-*gitignore*.

## ✨ Yang Baru di v2

- **Panel Admin** (`/admin`) — login, lalu CRUD (tambah/edit/hapus) untuk:
  - Informasi & Pengumuman
  - Program Kerja
  - Struktur Pengurus (per divisi)
  - Ganti password admin
- Upload gambar langsung dari panel admin (tersimpan di folder `uploads/`)
- Semua halaman publik menampilkan data **secara dinamis** dari database, jadi begitu admin tambah data, otomatis muncul di website — tidak perlu edit HTML manual lagi
- 5 halaman struktur (`struktur-bph.html`, dst) disatukan jadi 1 halaman `struktur.html` dengan filter divisi
- Desain diperbarui: sistem warna & komponen konsisten di semua halaman, dark mode tetap ada, animasi scroll halus, layout lebih rapi & modern
- Header/footer dipisah jadi partial (`partials/header.html`, `partials/footer.html`) supaya tidak perlu edit berkali-kali kalau mau ubah navbar
- Struktur folder lebih rapi dan siap di-deploy

## 🚀 Cara Menjalankan (lokal)

Butuh [Node.js](https://nodejs.org) versi 18 ke atas.

```bash
# 1. Install dependency
npm install

# 2. Salin file environment
cp .env.example .env
# lalu edit .env, minimal ganti SESSION_SECRET dan ADMIN_PASSWORD

# 3. Jalankan
npm start
```

Buka:
- Website: http://localhost:3000
- Panel admin: http://localhost:3000/admin

**Login admin default** (ganti lewat `.env` sebelum pertama kali dijalankan, atau lewat halaman Profil setelah login):
- Email: `admin@himatekkom.local`
- Password: `himatekkom2026`

> Password ini hanya dipakai saat database (`data/db.json`) pertama kali dibuat. Setelah itu, ganti lewat `.env` tidak akan berpengaruh lagi — gunakan menu ganti password di halaman Profil.

### Mengaktifkan "Login dengan Google"

Login dengan Google **opsional** — kalau tidak dikonfigurasi, tombolnya akan menampilkan pesan "belum dikonfigurasi" dan user tetap bisa daftar/login pakai email+password biasa.

Untuk mengaktifkannya:
1. Buka [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Buat project baru (atau pakai yang sudah ada)
3. Configure **OAuth consent screen** (pilih External, isi nama app & email kontak)
4. Buat **OAuth Client ID** dengan tipe **Web application**
5. Tambahkan Authorized redirect URI: `http://localhost:3000/api/auth/google/callback` (ganti domain kalau sudah deploy)
6. Copy **Client ID** dan **Client Secret** ke file `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
7. Restart server

Kalau mau akun Google tertentu otomatis jadi admin, set `ADMIN_EMAIL` di `.env` sama dengan email Google tersebut sebelum orang itu login pertama kali.

## 📁 Struktur Folder

```
himatekkom-web/
├── server.js              # Entry point Express + semua API
├── lib/
│   ├── db.js               # Helper baca/tulis database (file JSON)
│   └── seed.js              # Data awal (admin account + contoh konten)
├── data/
│   └── db.json              # Database (otomatis dibuat, JANGAN di-commit)
├── uploads/                 # Gambar hasil upload dari admin
└── public/
    ├── index.html, tentang.html, proker.html, informasi.html,
    │   struktur.html, pendaftaran.html, 404.html
    ├── admin/                # Panel admin (login + dashboard)
    ├── partials/             # header.html & footer.html (dipakai ulang)
    ├── css/style.css         # Design system
    ├── js/                   # main.js, layout.js
    └── assets/               # Logo & foto
```

## 🗄️ Tentang Database

Project ini memakai **database file JSON sederhana** (`data/db.json`), bukan PostgreSQL/MySQL — sengaja dibuat ringan supaya:
- Tidak perlu setup database server terpisah
- Bisa langsung jalan di hosting murah/gratis (Railway, Render, VPS kecil, dsb)
- Cukup untuk skala traffic website organisasi kampus

Kalau ke depan butuh skala lebih besar (ribuan data/traffic tinggi), tinggal ganti isi `lib/db.js` ke database sungguhan tanpa perlu ubah banyak di `server.js`.

## ☁️ Deploy ke Hosting

Bisa deploy ke platform apa pun yang mendukung Node.js, misalnya **Railway**, **Render**, atau VPS:

1. Push project ini ke repo GitHub (pastikan `.env` dan `data/db.json` tidak ikut ter-*commit* — sudah diatur di `.gitignore`)
2. Di platform hosting, set environment variables sesuai `.env.example`
3. Build command: `npm install`
4. Start command: `npm start`
5. Pastikan folder `uploads/` bersifat *persistent* (tidak hilang tiap deploy) — kalau platform memakai *ephemeral filesystem*, pertimbangkan pindah upload ke layanan seperti Cloudinary/S3 nanti.

## 📝 Catatan Lain

- Form **Pendaftaran** masih terhubung ke Google Apps Script yang sama seperti sebelumnya (spreadsheet pendaftaran). Kalau mau ganti tujuan penyimpanan, cari `script.google.com/macros` di `public/pendaftaran.html`.
- Chatbot sekarang berjalan penuh di sisi browser (rule-based, tanpa perlu menjalankan `chatbot_server.py` Flask terpisah) supaya lebih simpel untuk di-deploy. File Flask lama tidak dipakai lagi di versi ini.
- Fitur ganti bahasa ID/EN di versi lama dihapus sementara karena hanya menerjemahkan sebagian kecil teks navbar — bisa ditambahkan lagi nanti kalau memang dibutuhkan penuh.
- **Notifikasi** info terbaru memakai `localStorage` (per-browser, bukan per-akun) supaya bisa dipakai visitor yang belum login sekalipun. Kalau nanti mau notifikasi tersimpan per-akun lintas perangkat, tinggal tambahkan field `lastSeenNotifAt` di data user dan endpoint baru untuk update/baca nilai itu.
- **Tanya Jawab**: pertanyaan yang dikirim visitor (belum login) butuh nama+email manual; kalau sudah login, otomatis pakai data akun. Hanya pertanyaan berstatus "dijawab" yang tampil publik sebagai FAQ.
- Semua field `passwordHash` di-hash dengan bcrypt, session pakai cookie yang di-sign dengan `SESSION_SECRET` — pastikan ganti secret ini sebelum deploy production.
