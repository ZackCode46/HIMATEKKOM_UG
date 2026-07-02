// Entry point untuk Vercel Serverless Functions.
// Vercel otomatis mendeteksi file di folder /api sebagai function.
// File ini cuma meneruskan Express app dari server.js.
module.exports = require('../server');
