// Jalankan sekali di awal (otomatis dipanggil server.js) untuk membuat akun admin pertama + data contoh.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { readDB, writeDB, nextId } = require('./db');

function avatarFor(name) {
  const encoded = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?name=${encoded}&background=2952e3&color=fff&bold=true`;
}

async function seed() {
  const db = await readDB();
  let changed = false;

  if (!db.users || db.users.length === 0) {
    db.users = db.users || [];
    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@himatekkom.local';
    const password = process.env.ADMIN_PASSWORD || 'himatekkom2026';
    db.users.push({
      id: nextId(db, 'users'),
      name: 'Admin HIMATEKKOM',
      username,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      googleId: null,
      avatar: avatarFor('Admin HIMATEKKOM'),
      role: 'admin',
      provider: 'local',
      createdAt: new Date().toISOString()
    });
    console.log(`[seed] Akun admin dibuat -> email: ${email} / username: ${username}`);
    changed = true;
  }

  if (db.informasi.length === 0) {
    const now = new Date().toISOString();
    db.informasi.push(
      {
        id: nextId(db, 'informasi'),
        judul: 'Pendaftaran Anggota Baru Dibuka!',
        kategori: 'pengumuman',
        ringkasan: 'Bergabunglah bersama kami dalam perjalanan inovasi dan pengembangan teknologi.',
        konten: 'HIMATEKKOM membuka pendaftaran anggota baru untuk periode kepengurusan berikutnya. Yuk daftarkan diri kalian melalui menu Pendaftaran!',
        gambar: '',
        featured: true,
        tanggal: now
      },
      {
        id: nextId(db, 'informasi'),
        judul: 'Seminar Ulang Tahun HIMATEKKOM Ke-8',
        kategori: 'kegiatan',
        ringkasan: 'From Passion to Profession: Embracing AI for Career Growth.',
        konten: 'Kegiatan seminar tahunan HIMATEKKOM akan membahas peran AI dalam pengembangan karier di bidang teknologi.',
        gambar: '',
        featured: false,
        tanggal: now
      }
    );
    changed = true;
  }

  if (db.proker.length === 0) {
    db.proker.push(
      { id: nextId(db, 'proker'), judul: 'Seminar Ulang Tahun HIMATEKKOM', deskripsi: 'From Passion to Profession: Embracing AI for Career Growth.', tag: 'seminar', gambar: '' },
      { id: nextId(db, 'proker'), judul: 'HIMATEKKOM Goes To School', deskripsi: 'Memperkenalkan jurusan Teknik Komputer ke siswa/i SMA & SMK.', tag: 'sosialisasi', gambar: '' },
      { id: nextId(db, 'proker'), judul: 'Himpunan Collab', deskripsi: 'Kolaborasi antar organisasi kemahasiswaan untuk tujuan bersama.', tag: 'kolaborasi', gambar: '' },
      { id: nextId(db, 'proker'), judul: 'Company Visit', deskripsi: 'Kunjungan ke perusahaan/perwakilan industri IT.', tag: 'kunjungan', gambar: '' }
    );
    changed = true;
  }

  if (db.pengurus.length === 0) {
    db.pengurus.push(
      { id: nextId(db, 'pengurus'), nama: 'Nama Ketua', jabatan: 'Ketua Umum', divisi: 'BPH', foto: 'assets/ketua-umum.jpg', urutan: 1 },
      { id: nextId(db, 'pengurus'), nama: 'Nama Wakil', jabatan: 'Wakil Ketua Umum', divisi: 'BPH', foto: 'assets/wakil-ketua.jpg', urutan: 2 },
      { id: nextId(db, 'pengurus'), nama: 'Nama Sekretaris 1', jabatan: 'Sekretaris 1', divisi: 'BPH', foto: 'assets/sekretaris-1.jpg', urutan: 3 },
      { id: nextId(db, 'pengurus'), nama: 'Nama Sekretaris 2', jabatan: 'Sekretaris 2', divisi: 'BPH', foto: 'assets/sekretaris-2.jpg', urutan: 4 },
      { id: nextId(db, 'pengurus'), nama: 'Nama Bendahara 1', jabatan: 'Bendahara 1', divisi: 'BPH', foto: 'assets/bendahara-1.jpg', urutan: 5 },
      { id: nextId(db, 'pengurus'), nama: 'Nama Bendahara 2', jabatan: 'Bendahara 2', divisi: 'BPH', foto: 'assets/bendahara-2.jpg', urutan: 6 }
    );
    changed = true;
  }

  if (!db.pertanyaan) db.pertanyaan = [];
  if (db.pertanyaan.length === 0) {
    const now = new Date().toISOString();
    db.pertanyaan.push({
      id: nextId(db, 'pertanyaan'),
      userId: null,
      namaPenanya: 'Mahasiswa Baru',
      emailPenanya: '',
      pertanyaan: 'Apakah pendaftaran HIMATEKKOM terbuka untuk semua angkatan?',
      jawaban: 'Terbuka untuk seluruh mahasiswa aktif jurusan Teknik Komputer dari berbagai angkatan. Silakan isi formulir di menu Pendaftaran.',
      status: 'dijawab',
      createdAt: now,
      answeredAt: now
    });
    changed = true;
  }

  if (changed) {
    await writeDB(db);
    console.log('[seed] Database siap.');
  }
}

if (require.main === module) {
  seed().catch((err) => { console.error('Seed gagal:', err); process.exit(1); });
}

module.exports = { seed };
