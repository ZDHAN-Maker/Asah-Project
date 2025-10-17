const Joi = require('joi');
const InvariantError = require('../../utils/error/InvariantError');

const collaboratorSchema = Joi.object({
  playlistId: Joi.string().required().messages({
    'string.empty': 'Playlist ID tidak boleh kosong',
    'any.required': 'Playlist ID wajib diisi',
  }),
  userId: Joi.string().required().messages({
    'string.empty': 'User ID tidak boleh kosong',
    'any.required': 'User ID wajib diisi',
  }),
});

function validateCollaborator(payload) {
  const { error } = collaboratorSchema.validate(payload, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    throw new InvariantError(message);
  }
}

module.exports = validateCollaborator;
