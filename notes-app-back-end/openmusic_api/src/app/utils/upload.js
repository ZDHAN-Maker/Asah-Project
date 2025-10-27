const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pastikan folder upload ada
const uploadDir = path.resolve(__dirname, './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const albumId = req.params.id || 'unknown';
    const ext = path.extname(file.originalname) || '.png';
    const filename = `cover-${albumId}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

// Filter file untuk hanya menerima gambar
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipe file harus berupa gambar (png, jpg, jpeg, webp)'), false);
  }
};

// Instance multer dengan error handling
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 512 * 1024, // 512KB (mengatur ukuran file maksimum)
  },
});

// Middleware untuk upload cover
const uploadCover = (req, res) => {
  const multerMiddleware = upload.single('cover');

  multerMiddleware(req, res, (err) => {
    if (err) {
      if (err.message === 'Tipe file harus berupa gambar (png, jpg, jpeg, webp)') {
        return res.status(400).json({
          status: 'fail',
          message: 'Tipe file harus berupa gambar (png, jpg, jpeg, webp)',
        });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          status: 'fail',
          message: 'File terlalu besar. Ukuran file maksimum adalah 512KB.',
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server.',
      });
    }
    // Jika berhasil, ubah status menjadi 201 untuk resource creation
    return res.status(201).json({
      status: 'success',
      message: 'Cover album berhasil diunggah.',
      file: req.file,
    });
  });
};

module.exports = { uploadCover };
