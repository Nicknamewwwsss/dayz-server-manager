"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerMiddleware = void 0;
const logger_1 = require("../util/logger");
const logger = new logger_1.Logger('HTTP API');
const loggerMiddleware = (req, resp, next) => {
    logger.log(logger_1.LogLevel.DEBUG, 'Request:', req.method, req.path, req.query, typeof req.body === 'object' ? JSON.stringify(req.body) : req.body);
    next();
};
exports.loggerMiddleware = loggerMiddleware;
//# sourceMappingURL=logger.js.map