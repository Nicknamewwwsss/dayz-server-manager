"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
// eslint-disable-next-line no-shadow
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["IMPORTANT"] = 2] = "IMPORTANT";
    LogLevel[LogLevel["WARN"] = 3] = "WARN";
    LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
// eslint-disable-next-line @typescript-eslint/naming-convention
const LogLevelNames = [
    'DEBUG    ',
    'INFO     ',
    'IMPORTANT',
    'WARN     ',
    'ERROR    ',
];
class Logger {
    constructor(context) {
        this.context = context;
        this.MAX_CONTEXT_LENGTH = 10;
    }
    formatContext(context) {
        if (context.length >= this.MAX_CONTEXT_LENGTH) {
            return context.slice(0, this.MAX_CONTEXT_LENGTH);
        }
        return context.padEnd(this.MAX_CONTEXT_LENGTH);
    }
    log(level, msg, ...data) {
        var _a;
        const allowedLevel = (_a = Logger.LOG_LEVELS[this.context]) !== null && _a !== void 0 ? _a : Logger.defaultLogLevel;
        if (level >= allowedLevel) {
            const date = false
                ? new Date().toLocaleString()
                : new Date().toISOString();
            const fmt = `@${date} | ${LogLevelNames[level]} | ${this.formatContext(this.context)} | ${msg}`;
            if (data === null || data === void 0 ? void 0 : data.length) {
                Logger.LogLevelFncs[level](fmt, data);
            }
            else {
                Logger.LogLevelFncs[level](fmt);
            }
        }
    }
}
exports.Logger = Logger;
Logger.LOG_LEVELS = {};
Logger.defaultLogLevel = LogLevel.INFO;
// eslint-disable-next-line @typescript-eslint/naming-convention
Logger.LogLevelFncs = [
    console.log,
    console.log,
    console.log,
    console.warn,
    console.error,
];
//# sourceMappingURL=logger.js.map