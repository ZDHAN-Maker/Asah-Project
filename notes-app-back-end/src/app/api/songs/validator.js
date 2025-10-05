const Joi = require('joi');

const schema = Joi.object({
  title: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
  performer: Joi.string().optional(),
  genre: Joi.string().optional(),
  duration: Joi.number().integer().optional(),
  albumId: Joi.string().optional().allow(null),
});

const validateSong = (payload) => {
  const { error } = schema.validate(payload);
  if (error) {
    throw new Error(error.message);
  }
};

module.exports = { validateSong };
