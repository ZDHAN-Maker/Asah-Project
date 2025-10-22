const express = require('express');

const createUsersRouter = (usersHandler) => {
  const router = express.Router();

  router.post('/', usersHandler.postUserHandler.bind(usersHandler));
  router.post('/authentications', usersHandler.loginHandler.bind(usersHandler));
  router.put('/authentications', usersHandler.refreshHandler.bind(usersHandler));
  router.delete('/authentications', usersHandler.logoutHandler.bind(usersHandler));

  return router;
};

module.exports = createUsersRouter;
