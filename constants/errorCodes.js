module.exports = {
  // Server Errors (500)
  INTERNAL_ERROR: {
    httpStatusCode: 500,
    body: {
      code: "internal_error",
      message: "Internal server error",
    },
  },
  DATABASE_ERROR: {
    httpStatusCode: 500,
    body: {
      code: "database_error",
      message: "Database operation failed",
    },
  },
  REDIS_ERROR: {
    httpStatusCode: 500,
    body: {
      code: "redis_error",
      message: "Cache service unavailable",
    },
  },

  // Client Errors (400)
  OAUTH_ERROR: {
    httpStatusCode: 400,
    body: {
      code: "oauth_error",
      message: "OAuth authentication with Meta failed",
    },
  },
  VALIDATION_ERROR: {
    httpStatusCode: 400,
    body: {
      code: "validation_error",
      message: "Invalid input data",
    },
  },

  // Authentication Errors (401)
  UNAUTHORIZED: {
    httpStatusCode: 401,
    body: {
      code: "unauthorized",
      message: "Authentication required",
    },
  },
  INVALID_EMAIL_OR_PASSWORD: {
    httpStatusCode: 401,
    body: {
      code: "invalid_credentials",
      message: "Invalid email or password",
    },
  },
  SESSION_EXPIRED: {
    httpStatusCode: 401,
    body: {
      code: "session_expired",
      message: "Session expired, please login again",
    },
  },
  ACCOUNT_DISABLED: {
    httpStatusCode: 401,
    body: {
      code: "account_disabled",
      message: "Your account has been disabled. Please contact support",
    },
  },

  // Authorization Errors (403)
  FORBIDDEN: {
    httpStatusCode: 403,
    body: {
      code: "forbidden",
      message: "Insufficient permissions",
    },
  },

  // Not Found Errors (404)
  USER_NOT_FOUND: {
    httpStatusCode: 404,
    body: {
      code: "user_not_found",
      message: "User not found",
    },
  },
  RESOURCE_NOT_FOUND: {
    httpStatusCode: 404,
    body: {
      code: "resource_not_found",
      message: "Requested resource not found",
    },
  },

  // Upload Errors (400)
  UNSUPPORTED_FILE_TYPE: {
    httpStatusCode: 400,
    body: {
      code: "unsupported_file_type",
      message: "Unsupported file type. Supported types: PDF, DOCX, TXT, CSV, JSON, MD",
    },
  },
  FILE_TOO_LARGE: {
    httpStatusCode: 413,
    body: {
      code: "file_too_large",
      message: "File exceeds maximum allowed size",
    },
  },

  // Conflict Errors (409)
  USER_ALREADY_EXISTS: {
    httpStatusCode: 409,
    body: {
      code: "user_exists",
      message: "User with this email already exists",
    },
  },
  EMAIL_ALREADY_EXISTS: {
    httpStatusCode: 409,
    body: {
      code: "email_exists",
      message: "A user with this email address is already registered",
    },
  },
};
