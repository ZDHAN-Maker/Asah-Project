const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pastikan folder upload ada
const uploadDir = path.resolve(process.cwd(), 'uploads', 'covers');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const albumId = req.params?.id || 'unknown';
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `cover-${albumId}-${Date.now()}${ext}`);
  },
});

// Filter hanya gambar
const fileFilter = (_req, file, cb) => {
  const allowed = /^image\/(png|jpe?g|webp)$/i;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Invalid file type'), false);
  }
};

// Middleware upload
const uploadCover = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 512 * 1024, // 512KB
  },
}).single('cover');

module.exports = { uploadCover };
