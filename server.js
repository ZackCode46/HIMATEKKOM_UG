require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const { readDB, writeDB, nextId } = require('./lib/db');
const { seed } = require('./lib/seed');

// Pastikan database sudah ada (auto-seed sekali di awal)
seed();

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(express.json());
app.use(
  cookieSession({
    name: 'himatekkom_session',
    keys: [process.env.SESSION_SECRET || 'dev-secret-jangan-dipakai-di-production'],
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 hari
  })
);

// ---------- Upload gambar ----------
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Hanya file gambar (jpg, png, webp, gif) yang diperbolehkan'));
  }
});

// ---------- Helper ----------
function publicUser(u) {
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email, avatar: u.avatar, role: u.role, provider: u.provider, createdAt: u.createdAt };
}
function avatarFor(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=2952e3&color=fff&bold=true`;
}
function findUserById(db, id) {
  return db.users.find((u) => u.id === id);
}

// ---------- Middleware auth ----------
function requireUser(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: 'Silakan login terlebih dahulu' });
}
function requireAuth(req, res, next) {
  // requireAuth = harus login SEBAGAI ADMIN (dipakai endpoint lama & CRUD konten)
  if (req.session && req.session.userId && req.session.role === 'admin') return next();
  return res.status(401).json({ error: 'Khusus admin' });
}

// ================= AUTH: EMAIL/PASSWORD =================
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
  if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });

  const db = readDB();
  const emailLower = String(email).toLowerCase().trim();
  if (db.users.some((u) => u.email.toLowerCase() === emailLower)) {
    return res.status(409).json({ error: 'Email sudah terdaftar. Silakan login.' });
  }

  const user = {
    id: nextId(db, 'users'),
    name: name.trim(),
    email: emailLower,
    passwordHash: bcrypt.hashSync(password, 10),
    googleId: null,
    avatar: avatarFor(name),
    role: 'user',
    provider: 'local',
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  writeDB(db);

  req.session.userId = user.id;
  req.session.role = user.role;
  res.status(201).json({ ok: true, user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const db = readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Email atau password salah' });
  }
  if (!bcrypt.compareSync(password || '', user.passwordHash)) {
    return res.status(401).json({ error: 'Email atau password salah' });
  }
  req.session.userId = user.id;
  req.session.role = user.role;
  res.json({ ok: true, user: publicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session || !req.session.userId) return res.json({ user: null });
  const db = readDB();
  const user = findUserById(db, req.session.userId);
  if (!user) return res.json({ user: null });
  res.json({ user: publicUser(user) });
});

app.put('/api/auth/me', requireUser, (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nama tidak boleh kosong' });
  const db = readDB();
  const user = findUserById(db, req.session.userId);
  if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
  user.name = name.trim();
  if (user.provider === 'local') user.avatar = avatarFor(user.name);
  writeDB(db);
  res.json({ ok: true, user: publicUser(user) });
});

app.post('/api/auth/change-password', requireUser, (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  const db = readDB();
  const user = findUserById(db, req.session.userId);
  if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
  if (!user.passwordHash) {
    return res.status(400).json({ error: 'Akun ini masuk lewat Google dan tidak memiliki password.' });
  }
  if (!bcrypt.compareSync(oldPassword || '', user.passwordHash)) {
    return res.status(400).json({ error: 'Password lama salah' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
  }
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  writeDB(db);
  res.json({ ok: true });
});

// ================= AUTH: GOOGLE OAUTH =================
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${BASE_URL}/api/auth/google/callback`;

app.get('/api/auth/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.redirect('/login.html?error=google_not_configured');
  }
  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account'
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state || state !== req.session.oauthState) {
      return res.redirect('/login.html?error=google_state_invalid');
    }
    req.session.oauthState = null;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Gagal mendapatkan access token dari Google');

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileRes.json();
    if (!profile.email) throw new Error('Gagal mengambil profil Google');

    const db = readDB();
    let user = db.users.find((u) => u.googleId === profile.sub || u.email.toLowerCase() === profile.email.toLowerCase());

    const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (user) {
      user.googleId = profile.sub;
      user.avatar = profile.picture || user.avatar;
      user.name = user.name || profile.name;
      if (user.provider !== 'admin-local') user.provider = 'google';
    } else {
      user = {
        id: nextId(db, 'users'),
        name: profile.name || profile.email.split('@')[0],
        email: profile.email.toLowerCase(),
        passwordHash: null,
        googleId: profile.sub,
        avatar: profile.picture || avatarFor(profile.name),
        role: ADMIN_EMAIL && profile.email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user',
        provider: 'google',
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
    }
    writeDB(db);

    req.session.userId = user.id;
    req.session.role = user.role;
    res.redirect('/profil.html');
  } catch (err) {
    console.error('Google OAuth error:', err.message);
    res.redirect('/login.html?error=google_failed');
  }
});

// ================= UPLOAD =================
app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ================= GENERIC CRUD FACTORY (konten: informasi/proker/pengurus) =================
function crud(collection, allowedFields) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const db = readDB();
    let items = db[collection];
    for (const [key, value] of Object.entries(req.query)) {
      if (allowedFields.includes(key)) {
        items = items.filter((it) => String(it[key]).toLowerCase() === String(value).toLowerCase());
      }
    }
    res.json(items);
  });

  router.get('/:id', (req, res) => {
    const db = readDB();
    const item = db[collection].find((it) => it.id === Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json(item);
  });

  router.post('/', requireAuth, (req, res) => {
    const db = readDB();
    const body = req.body || {};
    const item = { id: nextId(db, collection) };
    for (const field of allowedFields) item[field] = body[field] ?? '';
    if (collection === 'informasi') item.tanggal = new Date().toISOString();
    db[collection].push(item);
    writeDB(db);
    res.status(201).json(item);
  });

  router.put('/:id', requireAuth, (req, res) => {
    const db = readDB();
    const idx = db[collection].findIndex((it) => it.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Data tidak ditemukan' });
    const body = req.body || {};
    for (const field of allowedFields) {
      if (field in body) db[collection][idx][field] = body[field];
    }
    writeDB(db);
    res.json(db[collection][idx]);
  });

  router.delete('/:id', requireAuth, (req, res) => {
    const db = readDB();
    const idx = db[collection].findIndex((it) => it.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Data tidak ditemukan' });
    const removed = db[collection].splice(idx, 1);
    writeDB(db);
    res.json({ ok: true, removed: removed[0] });
  });

  return router;
}

app.use('/api/informasi', crud('informasi', ['judul', 'kategori', 'ringkasan', 'konten', 'gambar', 'featured', 'tanggal']));
app.use('/api/proker', crud('proker', ['judul', 'deskripsi', 'tag', 'gambar']));
app.use('/api/pengurus', crud('pengurus', ['nama', 'jabatan', 'divisi', 'foto', 'urutan']));

// ================= TANYA JAWAB (Q&A) =================
app.get('/api/pertanyaan', (req, res) => {
  const db = readDB();
  const isAdmin = req.session && req.session.role === 'admin';

  if (req.query.all === '1') {
    if (!isAdmin) return res.status(401).json({ error: 'Khusus admin' });
    return res.json(db.pertanyaan.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }
  if (req.query.mine === '1') {
    if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Silakan login terlebih dahulu' });
    return res.json(
      db.pertanyaan
        .filter((p) => p.userId === req.session.userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    );
  }
  res.json(
    db.pertanyaan
      .filter((p) => p.status === 'dijawab')
      .sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt))
  );
});

app.post('/api/pertanyaan', (req, res) => {
  const { pertanyaan, namaPenanya, emailPenanya } = req.body || {};
  if (!pertanyaan || !pertanyaan.trim()) return res.status(400).json({ error: 'Pertanyaan tidak boleh kosong' });

  const db = readDB();
  let userId = null;
  let nama = namaPenanya;
  let email = emailPenanya;

  if (req.session && req.session.userId) {
    const user = findUserById(db, req.session.userId);
    if (user) { userId = user.id; nama = user.name; email = user.email; }
  }
  if (!nama || !email) {
    return res.status(400).json({ error: 'Nama dan email wajib diisi (atau login terlebih dahulu)' });
  }

  const item = {
    id: nextId(db, 'pertanyaan'),
    userId,
    namaPenanya: nama,
    emailPenanya: email,
    pertanyaan: pertanyaan.trim(),
    jawaban: null,
    status: 'menunggu',
    createdAt: new Date().toISOString(),
    answeredAt: null
  };
  db.pertanyaan.push(item);
  writeDB(db);
  res.status(201).json(item);
});

app.put('/api/pertanyaan/:id', requireAuth, (req, res) => {
  const db = readDB();
  const item = db.pertanyaan.find((p) => p.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Pertanyaan tidak ditemukan' });
  const { jawaban } = req.body || {};
  if (!jawaban || !jawaban.trim()) return res.status(400).json({ error: 'Jawaban tidak boleh kosong' });
  item.jawaban = jawaban.trim();
  item.status = 'dijawab';
  item.answeredAt = new Date().toISOString();
  writeDB(db);
  res.json(item);
});

app.delete('/api/pertanyaan/:id', requireAuth, (req, res) => {
  const db = readDB();
  const idx = db.pertanyaan.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Pertanyaan tidak ditemukan' });
  const removed = db.pertanyaan.splice(idx, 1);
  writeDB(db);
  res.json({ ok: true, removed: removed[0] });
});

// ================= STATIC FILES =================
app.use('/uploads', express.static(uploadDir));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(PORT, () => {
  console.log(`\n✅ HIMATEKKOM website jalan di ${BASE_URL}`);
  console.log(`   Panel admin: ${BASE_URL}/admin/\n`);
});
