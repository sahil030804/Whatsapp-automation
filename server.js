const express = require("express");
const { pinoHttp } = require("pino-http");
const { v4: uuidV4 } = require("uuid");
const { logger } = require("./lib/logger");
const { application } = require("./config");
const indexRoute = require("./components/indexRoute");
const port = application.port || 3120;

const app = express();

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers["x-request-id"] || uuidV4(),
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  }),
);
app.use("", indexRoute);

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
