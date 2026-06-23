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
  embeddedSignupValidation: {
    body: Joi.object({
      code: Joi.string().required().messages({
        "string.empty": "Authorization code is required",
        "any.required": "Authorization code is required",
      }),
      wabaId: Joi.string().required().messages({
        "string.empty": "WhatsApp Business Account id is required",
        "any.required": "WhatsApp Business Account id is required",
      }),
      phoneNumberId: Joi.string().optional().allow(null, ""),
    }),
  },
};
