const Joi = require('joi');
const InvariantError = require('../../utils/error/InvariantError');

const userSchema = Joi.object({
  username: Joi.string().min(3).required(),
  password: Joi.string().min(6).required(),
  fullname: Joi.string().min(1).required(),
});

exports.validateCreateUser = (payload) => {
  const { error } = userSchema.validate(payload);
  if (error) throw new InvariantError(error.message);
};
