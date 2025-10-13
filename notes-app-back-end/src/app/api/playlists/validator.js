const Joi = require('joi');
const InvariantError = require('../../utils/error/InvariantError');

exports.validateCreate = (payload) => {
  const { error } = Joi.object({ name: Joi.string().required() }).validate(payload);
  if (error) throw new InvariantError(error.message);
};

exports.validateSongPayload = (payload) => {
  const { error } = Joi.object({ songId: Joi.string().required() }).validate(payload);
  if (error) throw new InvariantError(error.message);
};
