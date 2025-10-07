const Joi = require('joi');
const InvariantError = require('../../utils/error/InvariantError');

const albumSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
});

function validateAlbum(payload) {
  const { error } = albumSchema.validate(payload, { abortEarly: false });
  if (error) {
    throw new InvariantError(error.message);
  }
}

module.exports = validateAlbum;
