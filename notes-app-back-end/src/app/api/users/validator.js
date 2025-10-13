const Joi = require('joi');
const ClientError = require('../../utils/error/ClientError');

const validateUser = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(3).required(),
    password: Joi.string().min(6).required(),
    fullname: Joi.string().required(),
  });

  const { error } = schema.validate(data);
  if (error) {
    throw new ClientError(error.details[0].message);
  }
};

const validateAuthentication = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(3).required(),
    password: Joi.string().min(6).required(),
  });

  const { error } = schema.validate(data);
  if (error) {
    throw new ClientError(error.details[0].message);
  }
};

module.exports = { validateUser, validateAuthentication };
