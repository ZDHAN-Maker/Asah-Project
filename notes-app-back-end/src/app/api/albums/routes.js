const express = require('express');
const multer = require('multer');

function createAlbumsRouter(handler) {
  const router = express.Router();

  // === Konfigurasi upload (maks 512 KB) ===
  const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 512 * 1024 }, // 512 KB
  });

  // === CRUD Albums ===
  router.post('/', handler.postAlbumHandler);
  router.get('/:id', handler.getAlbumByIdHandler);
  router.put('/:id', handler.putAlbumByIdHandler);
  router.delete('/:id', handler.deleteAlbumByIdHandler);

  // === Upload Cover (middleware upload + error handling) ===
  router.post(
    '/:id/covers',
    (req, res, next) => {
      upload.single('cover')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          // File terlalu besar → 413 Payload Too Large
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
              status: 'fail',
              message: 'Ukuran file terlalu besar (maks 512KB)',
            });
          }
          // Error upload lainnya
          return res.status(400).json({
            status: 'fail',
            message: 'Terjadi kesalahan saat mengunggah file',
          });
        }

        if (err) {
          return res.status(500).json({
            status: 'error',
            message: 'Kesalahan server saat upload',
          });
        }

        // lanjut ke handler utama jika tidak ada error
        next();
      });
    },
    handler.postUploadCover
  );

  // === Likes ===
  router.post('/:id/likes', handler.postLikeAlbum);
  router.delete('/:id/likes', handler.deleteLikeAlbum);
  router.get('/:id/likes', handler.getAlbumLikes);

  return router;
}

module.exports = createAlbumsRouter;
