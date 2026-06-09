const Joi = require("joi");

module.exports = {
  uploadValidation: {
    body: Joi.object({
      waAccountId: Joi.number().integer().optional().messages({
        "number.base": "WhatsApp account ID must be a number",
      }),
    }),
  },
};
