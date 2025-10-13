const express = require('express');
const UsersHandler = require('./handler');

const createUsersRouter = () => {
  const router = express.Router();
  const usersHandler = new UsersHandler();

  router.post('/', (req, res) => usersHandler.postUserHandler(req, res));
  router.post('/authentications', (req, res) => usersHandler.loginHandler(req, res));
  router.put('/authentications', (req, res) => usersHandler.refreshHandler(req, res));
  router.delete('/authentications', (req, res) => usersHandler.logoutHandler(req, res));

  return router;
};

module.exports = createUsersRouter;
