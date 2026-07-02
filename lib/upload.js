// Upload gambar dual-mode:
// - Kalau env BLOB_READ_WRITE_TOKEN ADA (mis. saat di-deploy di Vercel + Blob storage) -> upload ke Vercel Blob.
// - Kalau TIDAK ADA (mis. jalan di laptop lokal) -> simpan ke folder uploads/ lokal seperti biasa.

const fs = require('fs');
const path = require('path');

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const uploadDir = path.join(__dirname, '..', 'uploads');

function safeExt(originalname) {
  const ext = path.extname(originalname || '').toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
}

async function saveImage(buffer, originalname) {
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt(originalname)}`;

  if (USE_BLOB) {
    const { put } = require('@vercel/blob');
    const blob = await put(`uploads/${filename}`, buffer, { access: 'public' });
    return blob.url;
  }

  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

module.exports = { saveImage, USE_BLOB, uploadDir };
