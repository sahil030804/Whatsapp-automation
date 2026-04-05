require("dotenv-safe").config();

module.exports = {
  application: {
    environment: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3120,
  },
};
