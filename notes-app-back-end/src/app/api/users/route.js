const express = require('express');
const UsersHandler = require('./handler');

module.exports = () => {
  const router = express.Router();
  router.post('/users', (req, res) => UsersHandler.postUserHandler(req, res));

  router.post('/authentications', (req, res) => UsersHandler.loginHandler(req, res));
  router.put('/authentications', (req, res) => UsersHandler.refreshHandler(req, res));
  router.delete('/authentications', (req, res) => UsersHandler.logoutHandler(req, res));
  return router;
};
