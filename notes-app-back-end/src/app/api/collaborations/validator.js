const Joi = require('joi');
const InvariantError = require('../../utils/error/InvariantError');

const collaboratorSchema = Joi.object({
  playlistId: Joi.string().required(),
  userId: Joi.string().required(),
});

function validateCollaborator(payload) {
  const { error } = collaboratorSchema.validate(payload, { abortEarly: false });
  if (error) {
    throw new InvariantError(error.message);
  }
}

module.exports = validateCollaborator;
