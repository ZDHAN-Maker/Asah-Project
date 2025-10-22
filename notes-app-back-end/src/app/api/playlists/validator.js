const Joi = require('joi');
const InvariantError = require('../../utils/error/InvariantError');

exports.validateCreate = (payload) => {
  const { error } = Joi.object({
    name: Joi.string().min(3).required().messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name cannot be empty',
      'string.min': 'Name must have at least 3 characters',
      'any.required': 'Name is required',
    }),
  }).validate(payload);

  if (error) throw new InvariantError(error.message);
};

exports.validateSongPayload = (payload) => {
  const { error } = Joi.object({
    songId: Joi.string().required().messages({
      'string.base': 'Song ID must be a string',
      'string.empty': 'Song ID cannot be empty',
      'any.required': 'Song ID is required',
    }),
  }).validate(payload);

  if (error) {
    throw new InvariantError(error.details[0].message, 400);
  }
};
