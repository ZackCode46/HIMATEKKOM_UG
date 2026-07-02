// Database sederhana berbasis file JSON.
// Cocok untuk skala website organisasi (traffic rendah-menengah),
// tanpa perlu setup database server terpisah.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function defaultData() {
  return {
    users: [], // { id, name, email, passwordHash, googleId, avatar, role, provider, createdAt }
    informasi: [],
    proker: [],
    pengurus: [],
    pertanyaan: [], // { id, userId, namaPenanya, emailPenanya, pertanyaan, jawaban, status, createdAt, answeredAt }
    lastIds: { users: 0, informasi: 0, proker: 0, pengurus: 0, pertanyaan: 0 }
  };
}

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    writeDB(defaultData());
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('db.json rusak/tidak valid, membuat ulang dari default.', err);
    const fresh = defaultData();
    writeDB(fresh);
    return fresh;
  }
}

function writeDB(data) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  // tulis ke file sementara dulu lalu rename, supaya lebih aman dari corrupt
  const tmpPath = DB_PATH + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_PATH);
}

function nextId(db, collection) {
  db.lastIds[collection] = (db.lastIds[collection] || 0) + 1;
  return db.lastIds[collection];
}

module.exports = { readDB, writeDB, nextId, DB_PATH };
