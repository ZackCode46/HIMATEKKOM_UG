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

## ☁️ Deploy ke Vercel (lewat GitHub)

Project ini sudah disiapkan supaya bisa jalan di Vercel: otomatis pakai **Neon Postgres** untuk database dan **Vercel Blob** untuk gambar begitu kamu hubungkan storage-nya — kamu **tidak perlu ubah kode apa pun**.

### 1. Push ke GitHub

```bash
cd himatekkom-web
git init
git add .
git commit -m "Initial commit: HIMATEKKOM website v2"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

> `data/db.json`, `.env`, `node_modules/`, dan `uploads/*` sudah otomatis di-*ignore* lewat `.gitignore`, jadi aman untuk di-push.

### 2. Import ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new), pilih **Import Project**, lalu pilih repo GitHub yang barusan kamu push
2. Framework Preset biarkan **Other** (Vercel otomatis mendeteksi folder `api/`)
3. Klik **Deploy** dulu — nanti kita lengkapi environment variable & storage-nya

### 3. Tambahkan Database (Neon Postgres)

1. Di dashboard project Vercel, buka tab **Storage**
2. Klik **Create Database** → pilih **Neon** (Postgres) → ikuti langkah setup (gratis untuk skala kecil)
3. Setelah terhubung, Vercel otomatis menambahkan environment variable `DATABASE_URL` ke project — tidak perlu diisi manual

### 4. Tambahkan Storage Gambar (Vercel Blob)

1. Masih di tab **Storage**, klik **Create Database** lagi → pilih **Blob**
2. Setelah terhubung, Vercel otomatis menambahkan `BLOB_READ_WRITE_TOKEN` — tidak perlu diisi manual

### 5. Lengkapi Environment Variable Lainnya

Di tab **Settings → Environment Variables**, tambahkan (minimal):

| Key | Value |
|---|---|
| `SESSION_SECRET` | string acak yang panjang (misal hasil dari `openssl rand -hex 32`) |
| `ADMIN_EMAIL` | email yang mau dipakai login admin pertama kali |
| `ADMIN_PASSWORD` | password admin pertama kali |
| `BASE_URL` | URL project Vercel kamu, misal `https://himatekkom.vercel.app` |

Kalau mau aktifkan Login dengan Google juga, tambahkan `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, dan `GOOGLE_CALLBACK_URL` (isi dengan `https://domain-vercel-kamu/api/auth/google/callback`) — jangan lupa daftarkan redirect URI itu juga di Google Cloud Console.

### 6. Redeploy

Setelah semua environment variable terisi, buka tab **Deployments** → titik tiga di deployment terakhir → **Redeploy**. Setelah selesai, database & akun admin otomatis ter-*seed* saat request pertama masuk.

### Menjalankan Lokal Setelah Migrasi Ini

Kamu tetap bisa jalanin di laptop **tanpa** setup Neon/Blob sama sekali — asal `DATABASE_URL` dan `BLOB_READ_WRITE_TOKEN` dikosongkan di `.env`, aplikasi otomatis balik pakai file lokal (`data/db.json`) dan folder `uploads/` seperti biasa. Cocok untuk development sehari-hari.

Kalau mau testing pakai database Neon yang sama persis dengan production dari laptop, tinggal isi `DATABASE_URL` di `.env` lokal dengan connection string dari Neon Console (tab Storage → Neon → **.env.local** → copy).

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

Project ini pakai **dual-mode database**, otomatis milih sesuai environment:

- **Lokal / development** (tidak ada `DATABASE_URL`) → file JSON sederhana di `data/db.json`. Tidak perlu setup database server sama sekali.
- **Vercel / production** (ada `DATABASE_URL`, otomatis ke-set kalau kamu connect Neon Postgres lewat tab Storage) → data tersimpan permanen di Postgres, karena Vercel tidak punya filesystem yang persisten.

Sama halnya untuk gambar: lokal disimpan di folder `uploads/`, di Vercel otomatis pakai **Vercel Blob** (kalau `BLOB_READ_WRITE_TOKEN` ter-set).

Logikanya ada di `lib/db.js` dan `lib/upload.js` — tidak perlu kamu ubah manual, semua otomatis terdeteksi dari environment variable yang ada.

## ☁️ Deploy ke Hosting Lain (selain Vercel)

Kalau suatu saat mau pindah dari Vercel ke platform yang mendukung Node.js server biasa (**Railway**, **Render**, VPS, dsb) yang punya filesystem persisten, project ini tetap bisa jalan **tanpa Postgres/Blob sama sekali** — cukup jangan set `DATABASE_URL`/`BLOB_READ_WRITE_TOKEN`, otomatis balik pakai file lokal:

1. Push project ke GitHub (langkah sama seperti di atas)
2. Di platform hosting, set environment variables sesuai `.env.example` (skip `DATABASE_URL` & `BLOB_READ_WRITE_TOKEN`)
3. Build command: `npm install`
4. Start command: `npm start`
5. Pastikan folder `uploads/` & `data/` bersifat *persistent volume* di platform tersebut (bukan ephemeral)

## 📝 Catatan Lain

- Form **Pendaftaran** masih terhubung ke Google Apps Script yang sama seperti sebelumnya (spreadsheet pendaftaran). Kalau mau ganti tujuan penyimpanan, cari `script.google.com/macros` di `public/pendaftaran.html`.
- Chatbot sekarang berjalan penuh di sisi browser (rule-based, tanpa perlu menjalankan `chatbot_server.py` Flask terpisah) supaya lebih simpel untuk di-deploy. File Flask lama tidak dipakai lagi di versi ini.
- Fitur ganti bahasa ID/EN di versi lama dihapus sementara karena hanya menerjemahkan sebagian kecil teks navbar — bisa ditambahkan lagi nanti kalau memang dibutuhkan penuh.
- **Notifikasi** info terbaru memakai `localStorage` (per-browser, bukan per-akun) supaya bisa dipakai visitor yang belum login sekalipun. Kalau nanti mau notifikasi tersimpan per-akun lintas perangkat, tinggal tambahkan field `lastSeenNotifAt` di data user dan endpoint baru untuk update/baca nilai itu.
- **Tanya Jawab**: pertanyaan yang dikirim visitor (belum login) butuh nama+email manual; kalau sudah login, otomatis pakai data akun. Hanya pertanyaan berstatus "dijawab" yang tampil publik sebagai FAQ.
- Semua field `passwordHash` di-hash dengan bcrypt, session pakai cookie yang di-sign dengan `SESSION_SECRET` — pastikan ganti secret ini sebelum deploy production.
- Paket `@vercel/postgres` sengaja **tidak dipakai** karena sudah di-deprecate Vercel per akhir 2025/awal 2026 — project ini pakai `@neondatabase/serverless` yang jadi rekomendasi resmi pengganti.
