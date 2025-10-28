const multer = require('multer');
const path = require('path');

const uploadDir = path.resolve(process.cwd(), 'uploads', 'covers');
const MAX_SIZE = 512 * 1024; // 512KB

// === Konfigurasi storage ===
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// === Filter file hanya gambar ===
function fileFilter(_req, file, cb) {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    err.message = 'Tipe file harus berupa gambar (png, jpg, jpeg, webp)';
    cb(err, false);
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single('cover'); // sesuai field name pada form-data

// === Middleware Express yang meng-handle error JSON ===
const uploadCover = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          status: 'fail',
          message: 'Ukuran file terlalu besar. Maksimal 512KB.',
        });
      }

      return res.status(400).json({
        status: 'fail',
        message: err.message || 'Tipe file tidak didukung.',
      });
    }

    if (err) {
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat upload file.',
      });
    }

    next();
  });
};

module.exports = { uploadCover };
