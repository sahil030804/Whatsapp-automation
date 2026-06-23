const Joi = require("joi");

module.exports = {
  updateBusinessProfileValidation: {
    body: Joi.object({
      business_name: Joi.string().allow(null, "").max(255),
      industry: Joi.string().allow(null, "").max(255),
      description: Joi.string().allow(null, "").max(5000),
      website: Joi.string().allow(null, "").max(500),
      assistant_name: Joi.string().allow(null, "").max(120),
      tone: Joi.string()
        .valid(
          "friendly_professional",
          "formal",
          "casual",
          "concise",
          "enthusiastic",
        )
        .optional(),
      fallback_message: Joi.string().allow(null, "").max(2000),
      business_hours: Joi.string().allow(null, "").max(1000),
      escalation_note: Joi.string().allow(null, "").max(2000),
    }),
  },
  updateProfileValidation: {
    body: Joi.object({
      firstName: Joi.string().trim().allow(null, "").max(255),
      lastName: Joi.string().trim().allow(null, "").max(255),
      phone: Joi.string()
        .trim()
        .allow(null, "")
        .max(30)
        .pattern(/^\+?[0-9\s\-()]{7,20}$/)
        .messages({
          "string.pattern.base": "Please enter a valid phone number",
        }),
      email: Joi.string().trim().email().max(255).messages({
        "string.email": "Please enter a valid email address",
      }),
    })
      .min(1)
      .messages({
        "object.min": "No changes were provided",
      }),
  },
  testAIValidation: {
    body: Joi.object({
      message: Joi.string().required().min(1).max(2000).messages({
        "string.empty": "A message is required",
        "any.required": "A message is required",
      }),
    }),
  },
};
