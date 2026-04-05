const errorCodes = require("../constants/errorCodes");
const { ValidationError } = require("./validation");

class ErrorHandler {
  validationError(err) {
    const errors = [];
    let errorMessage = "";
    Object.keys(err.details).forEach((key) => {
      err.details[key].forEach((e) => {
        errors.push({
          location: key,
          messages: [e.message],
          field: e.path[0],
        });
        errorMessage = `${errorMessage}${e.message}\n`;
      });
    });
    return {
      httpStatusCode: err.statusCode,
      body: {
        success: false,
        error: "validation_error",
        message: errorMessage,
        errors,
      },
    };
  }

  getErrorResponse(error, request) {
    // Handle validation errors
    if (error instanceof ValidationError) {
      return this.validationError(error);
    }

    // Handle custom error codes thrown with Error("ERROR_NAME")
    const errorCode = errorCodes[error.message];
    if (errorCode) {
      return {
        httpStatusCode: errorCode.httpStatusCode,
        body: {
          success: false,
          error: errorCode.body.code,
          message: errorCode.body.message,
        },
      };
    }

    // Fallback to internal error for unknown errors
    return {
      httpStatusCode: errorCodes.INTERNAL_ERROR.httpStatusCode,
      body: {
        success: false,
        error: errorCodes.INTERNAL_ERROR.body.code,
        message: errorCodes.INTERNAL_ERROR.body.message,
      },
    };
  }
}

module.exports = new ErrorHandler();
