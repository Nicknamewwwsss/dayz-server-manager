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
exports.Events = void 0;
const cron = require("node-schedule");
const logger_1 = require("../util/logger");
const monitor_1 = require("../types/monitor");
class Events {
    constructor(manager) {
        this.manager = manager;
        this.log = new logger_1.Logger('Events');
        this.tasks = [];
    }
    start() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            for (const event of ((_a = this.manager.config.events) !== null && _a !== void 0 ? _a : [])) {
                const runTask = (task) => __awaiter(this, void 0, void 0, function* () {
                    var _b, _c;
                    void ((_c = (_b = task()) === null || _b === void 0 ? void 0 : _b.then(() => {
                        this.log.log(logger_1.LogLevel.DEBUG, `Successfully executed task '${event.name}'`);
                    })) === null || _c === void 0 ? void 0 : _c.catch(() => {
                        this.log.log(logger_1.LogLevel.WARN, `Failed to execute task '${event.name}'`);
                    }));
                });
                const checkAndRun = (task) => __awaiter(this, void 0, void 0, function* () {
                    var _d, _e;
                    if (((_e = (_d = this.manager) === null || _d === void 0 ? void 0 : _d.monitor) === null || _e === void 0 ? void 0 : _e.serverState) !== monitor_1.ServerState.STARTED) {
                        this.log.log(logger_1.LogLevel.WARN, `Skipping '${event.name}' because server is not in STARTED state`);
                        return;
                    }
                    void runTask(task);
                });
                const job = cron.scheduleJob(event.name, event.cron, () => {
                    this.log.log(logger_1.LogLevel.DEBUG, `Executing task '${event.name}' (${event.type})`);
                    switch (event.type) {
                        case 'restart': {
                            void checkAndRun(() => __awaiter(this, void 0, void 0, function* () {
                                yield this.manager.discord.relayRconMessage('Scheduled Restart!');
                                yield this.manager.monitor.killServer();
                            }));
                            break;
                        }
                        case 'message': {
                            void checkAndRun(() => this.manager.rcon.global(event.params[0]));
                            break;
                        }
                        case 'kickAll': {
                            void checkAndRun(() => void this.manager.rcon.kickAll());
                            break;
                        }
                        case 'lock': {
                            void checkAndRun(() => void this.manager.rcon.lock());
                            break;
                        }
                        case 'unlock': {
                            void checkAndRun(() => void this.manager.rcon.unlock());
                            break;
                        }
                        case 'backup': {
                            void runTask(() => this.manager.backup.createBackup());
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                });
                this.log.log(logger_1.LogLevel.INFO, `Scheduled '${event.name}' with pattern: ${event.cron} (Next run: ${job.nextInvocation().toISOString()})`);
                this.tasks.push(job);
            }
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const task of this.tasks) {
                try {
                    task.cancel();
                }
                catch (e) {
                    this.log.log(logger_1.LogLevel.DEBUG, `Stopping event schedule for '${task.name}' failed`, e);
                }
            }
            this.tasks = [];
        });
    }
}
exports.Events = Events;
//# sourceMappingURL=events.js.map