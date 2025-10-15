const Joi = require('joi');
const ClientError = require('../../utils/error/ClientError');

const userSchema = Joi.object({
  username: Joi.string().min(3).required(),
  password: Joi.string().min(6).required(),
  fullname: Joi.string().min(1).required(),
});

exports.validateCreateUser = (body) => {
  const { error } = userSchema.validate(body);

  if (error) {
    throw new ClientError(error.details[0].message, 400);
  }
};
