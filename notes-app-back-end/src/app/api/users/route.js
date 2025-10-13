const express = require('express');
const UsersHandler = require('./handler');
const authMiddleware = require('../../middleware/authmiddleware');

const createUsersRouter = () => {
  const router = express.Router();

  router.post('/', UsersHandler.postUserHandler);

  router.post('/authentications', UsersHandler.postAuthenticationHandler);

  router.put('/authentications', UsersHandler.putAuthenticationHandler);

  router.delete('/authentications', UsersHandler.deleteAuthenticationHandler);

  return router;
};

module.exports = createUsersRouter;
