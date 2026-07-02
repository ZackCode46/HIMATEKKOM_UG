// Database dual-mode:
// - Kalau env POSTGRES_URL ADA (mis. saat di-deploy di Vercel + Postgres storage) -> pakai Postgres.
// - Kalau TIDAK ADA (mis. jalan di laptop lokal) -> pakai file JSON seperti biasa.
// Semua fungsi di sini async, jadi pemanggilnya selalu pakai `await`, terlepas dari mode yang dipakai.

const fs = require('fs');
const path = require('path');

const USE_POSTGRES = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');
const ROW_ID = 1;

function defaultData() {
  return {
    users: [],
    informasi: [],
    proker: [],
    pengurus: [],
    pertanyaan: [],
    lastIds: { users: 0, informasi: 0, proker: 0, pengurus: 0, pertanyaan: 0 }
  };
}

// ---------------- Mode: file lokal (data/db.json) ----------------
function readFileDB() {
  if (!fs.existsSync(DB_PATH)) writeFileDB(defaultData());
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('db.json rusak/tidak valid, membuat ulang dari default.', err);
    const fresh = defaultData();
    writeFileDB(fresh);
    return fresh;
  }
}
function writeFileDB(data) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const tmpPath = DB_PATH + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_PATH);
}

// ---------------- Mode: Postgres (Neon, terhubung lewat Vercel Marketplace) ----------------
let _sql = null;
function getSql() {
  if (!_sql) {
    const { neon } = require('@neondatabase/serverless');
    _sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  }
  return _sql;
}
async function ensureTable() {
  const sql = getSql();
  await sql`CREATE TABLE IF NOT EXISTS himatekkom_app_data (id INT PRIMARY KEY, data JSONB NOT NULL)`;
}
async function readPostgresDB() {
  const sql = getSql();
  await ensureTable();
  const rows = await sql`SELECT data FROM himatekkom_app_data WHERE id = ${ROW_ID}`;
  if (rows.length === 0) {
    const fresh = defaultData();
    await sql`INSERT INTO himatekkom_app_data (id, data) VALUES (${ROW_ID}, ${JSON.stringify(fresh)}::jsonb)`;
    return fresh;
  }
  return rows[0].data;
}
async function writePostgresDB(data) {
  const sql = getSql();
  await ensureTable();
  await sql`
    INSERT INTO himatekkom_app_data (id, data) VALUES (${ROW_ID}, ${JSON.stringify(data)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `;
}

// ---------------- Interface publik (selalu async) ----------------
async function readDB() {
  return USE_POSTGRES ? readPostgresDB() : readFileDB();
}
async function writeDB(data) {
  return USE_POSTGRES ? writePostgresDB(data) : writeFileDB(data);
}
function nextId(db, collection) {
  db.lastIds[collection] = (db.lastIds[collection] || 0) + 1;
  return db.lastIds[collection];
}

module.exports = { readDB, writeDB, nextId, USE_POSTGRES };
