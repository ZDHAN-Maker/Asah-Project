const multer = require('multer');
const fs = require('fs');
const path = require('path');

const dest = path.join(process.cwd(), 'uploads', 'covers');
if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dest),
  filename: (req, file, cb) => {
    const ext = (file.originalname.split('.').pop() || 'png').toLowerCase();
    cb(null, `cover-${req.params.id}-${Date.now()}.${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (/^image\/(png|jpe?g|webp)$/i.test(file.mimetype)) cb(null, true);
  else cb(new Error('Tipe konten harus gambar'), false);
};
const uploadCover = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('cover');

module.exports = { uploadCover };
