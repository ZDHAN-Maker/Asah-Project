const express = require('express');
const authMiddleware = require('../../middleware/authmiddleware');

const createCollaboratorRoute = (handler) => {
    const router = express.Router();

    router.post('/', authMiddleware, handler.postCollaboratorHandler);
    router.delete('/', authMiddleware, handler.deleteCollaboratorHandler);

    return router;
};

module.exports = createCollaboratorRoute;
