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
exports.Interface = exports.RequestTemplate = void 0;
const interface_1 = require("../types/interface");
const logger_1 = require("../util/logger");
const merge_1 = require("../util/merge");
const table_1 = require("../util/table");
const http2_1 = require("http2");
class RequestTemplate {
    constructor() {
        this.action = (r) => __awaiter(this, void 0, void 0, function* () {
            return {
                status: http2_1.constants.HTTP_STATUS_GONE,
                body: `Unknown Resource: ${r === null || r === void 0 ? void 0 : r.resource}`,
            };
        });
        this.level = 'admin';
        this.method = 'get';
        this.params = [];
        this.paramsOptional = false;
        this.disableDiscord = false;
        this.discordPublic = false;
        this.disableRest = false;
    }
    static build(optionals) {
        return merge_1.merge(new RequestTemplate(), optionals);
    }
}
exports.RequestTemplate = RequestTemplate;
class Interface {
    constructor(manager) {
        this.manager = manager;
        this.log = new logger_1.Logger('Manager');
        this.getDayZProcesses = (req) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = yield ((_a = this.manager.monitor) === null || _a === void 0 ? void 0 : _a.getDayZProcesses());
            if (!(result === null || result === void 0 ? void 0 : result.length)) {
                throw new interface_1.Response(http2_1.constants.HTTP_STATUS_NOT_FOUND, 'Could not find any processes ¯\\_(ツ)_/¯');
            }
            if (this.acceptsText(req)) {
                return table_1.makeTable([
                    ['Name', 'PID', 'Created', 'Path'],
                    ...result.map((x) => [
                        x.Name,
                        x.ProcessId,
                        x.CreationDate,
                        x.ExecutablePath,
                    ]),
                ]).join('\n');
            }
            return result;
        });
        this.getSystemReport = (req) => __awaiter(this, void 0, void 0, function* () {
            var _b;
            const result = yield ((_b = this.manager.monitor) === null || _b === void 0 ? void 0 : _b.getSystemReport());
            if (!result) {
                throw new interface_1.Response(http2_1.constants.HTTP_STATUS_NOT_FOUND, 'Could not determine system state');
            }
            return this.acceptsText(req) ? result.format() : result;
        });
        this.getPlayers = (req) => __awaiter(this, void 0, void 0, function* () {
            var _c, _d;
            if (this.acceptsText(req)) {
                return (_c = this.manager.rcon) === null || _c === void 0 ? void 0 : _c.getPlayersRaw();
            }
            return (_d = this.manager.rcon) === null || _d === void 0 ? void 0 : _d.getPlayers();
        });
        this.getBans = (req) => __awaiter(this, void 0, void 0, function* () {
            var _e, _f;
            if (this.acceptsText(req)) {
                return (_e = this.manager.rcon) === null || _e === void 0 ? void 0 : _e.getBansRaw();
            }
            return (_f = this.manager.rcon) === null || _f === void 0 ? void 0 : _f.getBans();
        });
        this.setupCommandMap();
    }
    singleParamWrapper(param, fnc, result, optional) {
        return (req) => __awaiter(this, void 0, void 0, function* () {
            const paramVal = req.body ? req.body[param] : null;
            if (!optional && !paramVal) {
                return new interface_1.Response(http2_1.constants.HTTP_STATUS_BAD_REQUEST, `Missing param ${param}`);
            }
            if (result) {
                return this.executeWithResult(req, () => fnc(paramVal));
            }
            return this.executeWithoutResult(req, () => fnc(paramVal));
        });
    }
    setupCommandMap() {
        this.commandMap = new Map([
            ['ping', RequestTemplate.build({
                    level: 'view',
                    disableRest: true,
                    action: (req) => this.executeWithResult(req, () => __awaiter(this, void 0, void 0, function* () { return 'I won\'t say pong you stupid fuck'; })),
                })],
            ['process', RequestTemplate.build({
                    level: 'view',
                    action: (req) => this.executeWithResult(req, this.getDayZProcesses),
                })],
            ['system', RequestTemplate.build({
                    level: 'view',
                    action: (req) => this.executeWithResult(req, this.getSystemReport),
                })],
            ['players', RequestTemplate.build({
                    level: 'view',
                    action: (req) => this.executeWithResult(req, this.getPlayers),
                })],
            ['bans', RequestTemplate.build({
                    level: 'view',
                    action: (req) => this.executeWithResult(req, this.getBans),
                })],
            ['lock', RequestTemplate.build({
                    method: 'post',
                    level: 'moderate',
                    action: (req) => this.executeWithoutResult(req, () => { var _a; return (_a = this.manager.rcon) === null || _a === void 0 ? void 0 : _a.lock(); }),
                })],
            ['unlock', RequestTemplate.build({
                    method: 'post',
                    level: 'moderate',
                    action: (req) => this.executeWithoutResult(req, () => { var _a; return (_a = this.manager.rcon) === null || _a === void 0 ? void 0 : _a.unlock(); }),
                })],
            ['global', RequestTemplate.build({
                    method: 'post',
                    level: 'moderate',
                    params: ['message'],
                    action: this.singleParamWrapper('message', (message) => { var _a; return (_a = this.manager.rcon) === null || _a === void 0 ? void 0 : _a.global(message); }),
                })],
            ['kickall', RequestTemplate.build({
                    method: 'post',
                    level: 'moderate',
                    action: (req) => this.executeWithoutResult(req, () => { var _a; return (_a = this.manager.rcon) === null || _a === void 0 ? void 0 : _a.kickAll(); }),
                })],
            ['kick', RequestTemplate.build({
                    method: 'post',
                    level: 'moderate',
                    params: ['player'],
                    action: this.singleParamWrapper('player', (player) => { var _a; return (_a = this.manager.rcon) === null || _a === void 0 ? void 0 : _a.kick(player); }),
                })],
            ['ban', RequestTemplate.build({
                    method: 'post',
                    level: 'moderate',
                    params: ['player'],
                    action: this.singleParamWrapper('player', (player) => { var _a; return (_a = this.manager.rcon) === null || _a === void 0 ? void 0 : _a.ban(player); }),
                })],
            ['removeban', RequestTemplate.build({
                    method: 'post',
                    level: 'moderate',
                    params: ['player'],
                    action: this.singleParamWrapper('player', (player) => { var _a; return (_a = this.manager.rcon) === null || _a === void 0 ? void 0 : _a.removeBan(player); }),
                })],
            ['reloadbans', RequestTemplate.build({
                    method: 'post',
                    level: 'moderate',
                    action: (req) => this.executeWithoutResult(req, () => { var _a; return (_a = this.manager.rcon) === null || _a === void 0 ? void 0 : _a.reloadBans(); }),
                })],
            ['restart', RequestTemplate.build({
                    method: 'post',
                    level: 'manage',
                    params: ['force'],
                    paramsOptional: true,
                    action: this.singleParamWrapper('force', (force) => { var _a; return (_a = this.manager.monitor) === null || _a === void 0 ? void 0 : _a.killServer(!!force && force !== 'false'); }, false, true),
                })],
            ['isrestartlocked', RequestTemplate.build({
                    method: 'get',
                    level: 'view',
                    action: (req) => this.executeWithResult(req, () => __awaiter(this, void 0, void 0, function* () {
                        return this.manager.monitor.restartLock;
                    })),
                })],
            ['lockrestart', RequestTemplate.build({
                    method: 'post',
                    level: 'manage',
                    action: (req) => this.executeWithoutResult(req, () => __awaiter(this, void 0, void 0, function* () {
                        if (this.manager.monitor) {
                            this.manager.monitor.restartLock = true;
                        }
                    })),
                })],
            ['unlockrestart', RequestTemplate.build({
                    method: 'post',
                    level: 'manage',
                    action: (req) => this.executeWithoutResult(req, () => __awaiter(this, void 0, void 0, function* () {
                        if (this.manager.monitor) {
                            this.manager.monitor.restartLock = false;
                        }
                    })),
                })],
            ['metrics', RequestTemplate.build({
                    method: 'get',
                    level: 'manage',
                    disableDiscord: true,
                    params: ['type', 'since'],
                    action: (req) => __awaiter(this, void 0, void 0, function* () {
                        var _a;
                        if (!((_a = req.query) === null || _a === void 0 ? void 0 : _a.type)) {
                            return new interface_1.Response(http2_1.constants.HTTP_STATUS_BAD_REQUEST, `Missing param type`);
                        }
                        return this.executeWithResult(req, () => {
                            var _a;
                            const ts = ((_a = req.query) === null || _a === void 0 ? void 0 : _a.since) ? Number(req.query.since) : undefined;
                            return this.manager.metrics.fetchMetrics(req.query.type, ts);
                        });
                    }),
                })],
            ['deleteMetrics', RequestTemplate.build({
                    method: 'delete',
                    level: 'admin',
                    disableDiscord: true,
                    params: ['maxAgeDays'],
                    action: this.singleParamWrapper('maxAgeDays', (maxAgeDays) => __awaiter(this, void 0, void 0, function* () {
                        const days = Number(maxAgeDays);
                        if (days > 0) {
                            this.manager.metrics.deleteMetrics(days * 24 * 60 * 60 * 1000);
                        }
                    }), false, false),
                })],
            ['logs', RequestTemplate.build({
                    method: 'get',
                    level: 'manage',
                    disableDiscord: true,
                    params: ['type', 'since'],
                    action: (req) => __awaiter(this, void 0, void 0, function* () {
                        var _b;
                        if (!((_b = req.query) === null || _b === void 0 ? void 0 : _b.type)) {
                            return new interface_1.Response(http2_1.constants.HTTP_STATUS_BAD_REQUEST, `Missing param type`);
                        }
                        return this.executeWithResult(req, () => this.manager.logReader.fetchLogs(req.query.type, req.query.since ? Number(req.query.since) : undefined));
                    }),
                })],
            ['login', RequestTemplate.build({
                    method: 'post',
                    level: 'view',
                    disableDiscord: true,
                    action: (req) => this.executeWithResult(req, () => __awaiter(this, void 0, void 0, function* () {
                        const userLevel = this.manager.getUserLevel(req.user);
                        if (userLevel) {
                            this.log.log(logger_1.LogLevel.IMPORTANT, `User ${req.user} logged in`);
                        }
                        return userLevel;
                    })),
                })],
            ['config', RequestTemplate.build({
                    method: 'get',
                    level: 'admin',
                    disableDiscord: true,
                    action: (req) => this.executeWithResult(req, () => Promise.resolve(this.manager.config)),
                })],
            ['updateconfig', RequestTemplate.build({
                    method: 'post',
                    level: 'admin',
                    disableDiscord: true,
                    params: ['config'],
                    action: this.singleParamWrapper('config', (config) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            this.manager.configHelper.writeConfig(config);
                            return true;
                        }
                        catch (e) {
                            throw new interface_1.Response(http2_1.constants.HTTP_STATUS_BAD_REQUEST, e);
                        }
                    }), true, true),
                })],
            ['updatemods', RequestTemplate.build({
                    method: 'post',
                    level: 'manage',
                    disableDiscord: true,
                    action: (req) => this.executeWithResult(req, () => {
                        return this.manager.steamCmd.updateMods();
                    }),
                })],
            ['updateserver', RequestTemplate.build({
                    method: 'post',
                    level: 'manage',
                    disableDiscord: true,
                    action: (req) => this.executeWithResult(req, () => {
                        return this.manager.steamCmd.updateServer();
                    }),
                })],
            ['backup', RequestTemplate.build({
                    method: 'post',
                    level: 'manage',
                    action: (req) => this.executeWithoutResult(req, () => this.manager.backup.createBackup()),
                })],
            ['getbackups', RequestTemplate.build({
                    method: 'get',
                    level: 'manage',
                    action: (req) => this.executeWithResult(req, () => this.manager.backup.getBackups()),
                })],
            ['writemissionfile', RequestTemplate.build({
                    method: 'post',
                    level: 'manage',
                    disableDiscord: true,
                    params: ['file', 'content', 'createBackup'],
                    action: (req) => this.executeWithoutResult(req, () => {
                        var _a, _b, _c;
                        return this.manager.missionFiles.writeMissionFile((_a = req.body) === null || _a === void 0 ? void 0 : _a.file, (_b = req.body) === null || _b === void 0 ? void 0 : _b.content, (_c = req.body) === null || _c === void 0 ? void 0 : _c.createBackup);
                    }),
                })],
            ['readmissionfile', RequestTemplate.build({
                    method: 'get',
                    level: 'manage',
                    disableDiscord: true,
                    params: ['file'],
                    action: (req) => __awaiter(this, void 0, void 0, function* () {
                        var _c;
                        if (!((_c = req.query) === null || _c === void 0 ? void 0 : _c.file)) {
                            return new interface_1.Response(http2_1.constants.HTTP_STATUS_BAD_REQUEST, `Missing param 'file'`);
                        }
                        return this.executeWithResult(req, () => this.manager.missionFiles.readMissionFile(req.query.file));
                    }),
                })],
            ['readmissiondir', RequestTemplate.build({
                    method: 'get',
                    level: 'manage',
                    disableDiscord: true,
                    action: (req) => __awaiter(this, void 0, void 0, function* () {
                        var _d;
                        if (!((_d = req.query) === null || _d === void 0 ? void 0 : _d.dir)) {
                            return new interface_1.Response(http2_1.constants.HTTP_STATUS_BAD_REQUEST, `Missing param 'dir'`);
                        }
                        return this.executeWithResult(req, () => this.manager.missionFiles.readMissionDir(req.query.dir));
                    }),
                })],
            ['serverinfo', RequestTemplate.build({
                    method: 'get',
                    level: 'view',
                    disableDiscord: true,
                    action: (req) => this.executeWithResult(req, () => this.manager.getServerInfo()),
                })],
        ]);
    }
    handleExecutionError(req, error) {
        const errorMsg = `Error executing interface action: ${req.resource}`;
        this.log.log(logger_1.LogLevel.ERROR, errorMsg, error);
        if (error instanceof interface_1.Response) {
            return error;
        }
        return new interface_1.Response(http2_1.constants.HTTP_STATUS_INTERNAL_SERVER_ERROR, errorMsg);
    }
    executeWithoutResult(req, fnc) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fnc(req);
                return new interface_1.Response(http2_1.constants.HTTP_STATUS_OK, 'Done');
            }
            catch (e) {
                return this.handleExecutionError(req, e);
            }
        });
    }
    executeWithResult(req, fnc) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield fnc(req);
                if (!result) {
                    return new interface_1.Response(http2_1.constants.HTTP_STATUS_NOT_FOUND, 'Action had no results');
                }
                return new interface_1.Response(http2_1.constants.HTTP_STATUS_OK, result);
            }
            catch (e) {
                return this.handleExecutionError(req, e);
            }
        });
    }
    acceptsText(req) {
        var _a;
        return !!((_a = req === null || req === void 0 ? void 0 : req.accept) === null || _a === void 0 ? void 0 : _a.startsWith('text'));
    }
    // apply RBAC and audit
    actionRbacCheck(req) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const x = this.commandMap.get(req.resource);
            if (x.level) {
                const user = (_b = (_a = this.manager.config) === null || _a === void 0 ? void 0 : _a.admins) === null || _b === void 0 ? void 0 : _b.find((admin) => admin.userId === req.user);
                if (!user
                    || !req.user
                    || !this.manager.isUserOfLevel(req.user, x.level)) {
                    return new interface_1.Response(http2_1.constants.HTTP_STATUS_UNAUTHORIZED, 'You are not allowed to do that');
                }
                if (req.resource && x.method !== 'get') {
                    void this.manager.metrics.pushMetricValue('AUDIT', {
                        timestamp: new Date().valueOf(),
                        user: user.userId,
                        value: req,
                    });
                    if (req.resource !== 'global') {
                        this.log.log(logger_1.LogLevel.IMPORTANT, `User '${req.user}' executed: ${req.resource}`);
                    }
                }
            }
        });
    }
    // apply Init Lock
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    actionInitCheck(req) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.manager.initDone) {
                return new interface_1.Response(http2_1.constants.HTTP_STATUS_LOCKED, 'The ServerManager is currently starting...');
            }
            return null;
        });
    }
    execute(req) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.resource || !this.commandMap.has(req.resource)) {
                return new interface_1.Response(http2_1.constants.HTTP_STATUS_BAD_REQUEST, 'Unkown action');
            }
            const interceptors = [
                (r) => this.actionInitCheck(r),
                (r) => this.actionRbacCheck(r),
            ];
            for (const interceptor of interceptors) {
                const resp = yield interceptor(req);
                if (resp) {
                    return resp;
                }
            }
            return this.commandMap.get(req.resource).action(req);
        });
    }
}
exports.Interface = Interface;
//# sourceMappingURL=interface.js.map