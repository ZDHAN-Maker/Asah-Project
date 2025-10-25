const express = require('express');
const multer = require('multer');
const authMiddleware = require('../../middleware/authmiddleware');

function createAlbumsRouter(handler) {
  const router = express.Router();

  // === Konfigurasi Upload ===
  const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 512 * 1024 }, // 512 KB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Hanya file gambar yang diperbolehkan'));
      }
      cb(null, true);
    },
  });

  // === CRUD Albums ===
  router.post('/', (req, res) => handler.postAlbumHandler(req, res));
  router.get('/:id', (req, res) => handler.getAlbumByIdHandler(req, res));
  router.put('/:id', (req, res) => handler.putAlbumByIdHandler(req, res));
  router.delete('/:id', (req, res) => handler.deleteAlbumByIdHandler(req, res));

  // === Upload Cover ===
  router.post(
    '/:id/covers',
    (req, res, next) => {
      upload.single('cover')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
              status: 'fail',
              message: 'Ukuran file terlalu besar (maks 512KB)',
            });
          }

          return res.status(400).json({
            status: 'fail',
            message: 'Kesalahan saat mengunggah file',
          });
        }

        if (err) {
          return res.status(500).json({
            status: 'error',
            message: 'Kesalahan server saat upload',
          });
        }
        next();
      });
    },
    (req, res) => handler.postUploadCover(req, res)
  );

  // === Likes (Perlu Autentikasi) ===
  router.post('/:id/likes', authMiddleware, (req, res) => handler.postLikeAlbum(req, res));
  router.delete('/:id/likes', authMiddleware, (req, res) => handler.deleteLikeAlbum(req, res));

  // === Get Like Count (Boleh tanpa auth) ===
  router.get('/:id/likes', (req, res) => handler.getAlbumLikes(req, res));

  return router;
}

module.exports = createAlbumsRouter;
