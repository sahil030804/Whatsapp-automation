const expressValidation = require("express-validation");

class ExpressValidation {
  constructor() {
    this.ValidationError = expressValidation.ValidationError;
    // eslint-disable-next-line no-useless-escape
    this.emailRegex =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    this.passwordRegex =
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*()_\-=+?[\],.<>/\\|]).{8,}$/;
    this.nameRegex = /^[A-Za-z\s-]+$/;
    this.fullNameRegex = /^[A-Za-z\s-]+$/;
  }

  validate(schema) {
    return expressValidation.validate(schema, {}, { abortEarly: false });
  }
}

module.exports = new ExpressValidation();
