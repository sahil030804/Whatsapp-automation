const Joi = require("joi");

module.exports = {
  signupValidation: {
    body: Joi.object({
      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email address",
        "string.empty": "Email is required",
        "any.required": "Email is required",
      }),

      password: Joi.string()
        .min(8)
        .max(128)
        .pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        )
        .required()
        .messages({
          "string.min": "Password must be at least 8 characters long",
          "string.max": "Password must not exceed 128 characters",
          "string.pattern.base":
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
          "string.empty": "Password is required",
          "any.required": "Password is required",
        }),

      confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
          "any.only": "Passwords do not match",
          "string.empty": "Please confirm your password",
          "any.required": "Password confirmation is required",
        }),

      firstName: Joi.string()
        .min(1)
        .max(50)
        .pattern(/^[a-zA-Z\-\']+$/)
        .required()
        .messages({
          "string.min": "First name must be at least 1 character long",
          "string.max": "First name must not exceed 50 characters",
          "string.pattern.base":
            "First name can only contain letters, hyphens, and apostrophes",
          "string.empty": "First name is required",
          "any.required": "First name is required",
        }),

      lastName: Joi.string()
        .min(1)
        .max(50)
        .pattern(/^[a-zA-Z\-\']+$/)
        .required()
        .messages({
          "string.min": "Last name must be at least 1 character long",
          "string.max": "Last name must not exceed 50 characters",
          "string.pattern.base":
            "Last name can only contain letters, hyphens, and apostrophes",
          "string.empty": "Last name is required",
          "any.required": "Last name is required",
        }),

      phone: Joi.string()
        .pattern(/^[+]?[1-9]\d{1,14}$/)
        .optional()
        .messages({
          "string.pattern.base":
            "Please provide a valid phone number with country code",
        }),

      acceptTerms: Joi.boolean().valid(true).required().messages({
        "any.only": "You must accept the terms and conditions",
        "any.required": "You must accept the terms and conditions",
      }),
    }),
  },
  loginValidation: {
    body: Joi.object({
      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email address",
        "string.empty": "Email is required",
        "any.required": "Email is required",
      }),

      password: Joi.string().required().messages({
        "string.empty": "Password is required",
        "any.required": "Password is required",
      }),
    }),
  },

  forgotPasswordValidation: {
    body: Joi.object({
      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email address",
        "string.empty": "Email is required",
        "any.required": "Email is required",
      }),
    }),
  },

  resetPasswordValidation: {
    body: Joi.object({
      token: Joi.string().required().messages({
        "string.empty": "Reset token is required",
        "any.required": "Reset token is required",
      }),
      password: Joi.string()
        .min(8)
        .max(128)
        .pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        )
        .required()
        .messages({
          "string.min": "Password must be at least 8 characters long",
          "string.max": "Password must not exceed 128 characters",
          "string.pattern.base":
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
          "string.empty": "Password is required",
          "any.required": "Password is required",
        }),
    }),
  },
};
