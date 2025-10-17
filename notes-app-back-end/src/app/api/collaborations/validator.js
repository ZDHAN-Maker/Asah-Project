const Joi = require('joi');
const InvariantError = require('../../utils/error/InvariantError');

const CollaboratorSchema = Joi.object({
  playlistId: Joi.string().required(),
  userId: Joi.string().required(),
});

function validatorCollaborator(payload) {
  const { error } = CollaboratorSchema.validate(payload, { abortearly: false });
  if (error) {
    throw new InvariantError(error.message);
  }
}

module.exports = validatorCollaborator;
