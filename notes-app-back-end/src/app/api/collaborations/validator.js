const Joi = require('joi');
const InvariantError = require('../../utils/error/InvariantError');

const CollaboratorSchema = Joi.object({
    playlistId: Joi.string().required(),
    userId: Joi.string().required()
});