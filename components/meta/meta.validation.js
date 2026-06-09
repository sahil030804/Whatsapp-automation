const Joi = require("joi");

module.exports = {
  exchangeTokenValidation: {
    body: Joi.object({
      code: Joi.string().required().messages({
        "string.empty": "Authorization code is required",
        "any.required": "Authorization code is required",
      }),
      state: Joi.string().optional().messages({
        "string.empty": "OAuth state is required",
      }),
    }),
  },
};
