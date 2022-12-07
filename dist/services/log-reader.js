"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogReader = void 0;
const logger_1 = require("../util/logger");
const fs = require("fs");
const path = require("path");
const tail = require("tail");
const monitor_1 = require("../types/monitor");
const log_reader_1 = require("../types/log-reader");
const reverse_index_search_1 = require("../util/reverse-index-search");
class LogReader {
    constructor(manager) {
        this.manager = manager;
        this.log = new logger_1.Logger('LogReader');
        /* eslint-disable @typescript-eslint/naming-convention */
        this.logMap = {
            SCRIPT: {
                filter: (x) => x.toLowerCase().startsWith('script') && x.toLowerCase().endsWith('.log'),
            },
            ADM: {
                filter: (x) => x.toLowerCase().endsWith('.adm'),
            },
            RPT: {
                filter: (x) => x.toLowerCase().endsWith('.rpt'),
            },
        };
        /* eslint-enable @typescript-eslint/naming-convention */
        this.initDelay = 5000;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.manager.monitor.registerStateListener('LogReader', (x) => {
                if (x === monitor_1.ServerState.STARTED) {
                    setTimeout(() => {
                        void this.registerReaders();
                    }, this.initDelay);
                }
            });
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const type of Object.keys(log_reader_1.LogTypeEnum)) {
                const container = this.logMap[type];
                const t = container === null || container === void 0 ? void 0 : container.tail;
                if (t) {
                    t.unwatch();
                }
                container.logFiles = [];
                container.logLines = [];
            }
        });
    }
    getProfilesDir() {
        const profiles = this.manager.config.profilesPath;
        if (!path.isAbsolute(profiles)) {
            return path.resolve(path.join(this.manager.getServerPath(), profiles));
        }
        return profiles;
    }
    findLatestFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            const profiles = this.getProfilesDir();
            const files = yield fs.promises.readdir(profiles);
            const makeFileDescriptor = (file) => __awaiter(this, void 0, void 0, function* () {
                const fullPath = path.join(profiles, file);
                return {
                    file: fullPath,
                    mtime: (yield fs.promises.stat(fullPath)).mtime.getTime(),
                };
            });
            for (const type of Object.keys(log_reader_1.LogTypeEnum)) {
                this.logMap[type].logFiles = [];
            }
            for (const file of files) {
                for (const type of Object.keys(log_reader_1.LogTypeEnum)) {
                    const logContainer = this.logMap[type];
                    if (logContainer.filter(file)) {
                        logContainer.logFiles.push(yield makeFileDescriptor(file));
                    }
                }
            }
            for (const type of Object.keys(log_reader_1.LogTypeEnum)) {
                this.logMap[type].logFiles = this.logMap[type].logFiles
                    .sort((a, b) => {
                    return b.mtime - a.mtime;
                });
            }
        });
    }
    registerReaders() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.findLatestFiles();
            const createTail = (type, logContainer, retry) => {
                var _a;
                logContainer.logLines = [];
                if ((_a = logContainer.logFiles) === null || _a === void 0 ? void 0 : _a.length) {
                    logContainer.tail = new tail.Tail(logContainer.logFiles[0].file, {
                        follow: true,
                        fromBeginning: true,
                        flushAtEOF: true,
                    });
                    logContainer.tail.on('error', (e) => {
                        this.log.log(logger_1.LogLevel.WARN, `Error reading ${type}`, e);
                        logContainer.tail.unwatch();
                        if (!retry || retry < 1) {
                            setTimeout(() => createTail(type, logContainer, (retry !== null && retry !== void 0 ? retry : 0) + 1), 10000);
                        }
                    });
                    logContainer.tail.on('line', (line) => {
                        if (line) {
                            this.log.log(logger_1.LogLevel.DEBUG, `${type} - ${line}`);
                            logContainer.logLines.push({
                                timestamp: new Date().valueOf(),
                                message: line,
                            });
                        }
                    });
                }
            };
            for (const type of Object.keys(log_reader_1.LogTypeEnum)) {
                const logContainer = this.logMap[type];
                createTail(type, logContainer);
            }
        });
    }
    fetchLogs(type, since) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const logs = (_b = (_a = this.logMap[type]) === null || _a === void 0 ? void 0 : _a.logLines) !== null && _b !== void 0 ? _b : [];
            if (since && since > 0) {
                const idx = reverse_index_search_1.reverseIndexSearch(logs, (x) => x.timestamp <= since);
                if (idx !== -1) {
                    if (idx + 1 >= logs.length) {
                        return [];
                    }
                    return logs.slice(idx + 1);
                }
            }
            return logs;
        });
    }
}
exports.LogReader = LogReader;
//# sourceMappingURL=log-reader.js.map