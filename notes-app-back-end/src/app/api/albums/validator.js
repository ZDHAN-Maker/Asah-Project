const Joi = require('joi');

const schema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
});

const validateAlbum = (payload) => {
  const { error } = schema.validate(payload);
  if (error) {
    throw new Error(error.message);
  }
};

module.exports = { validateAlbum };
