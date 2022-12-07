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
exports.Monitor = exports.MonitorLoop = void 0;
const processes_1 = require("../util/processes");
const child_process_1 = require("child_process");
const paths_1 = require("../util/paths");
const fs = require("fs");
const path = require("path");
const logger_1 = require("../util/logger");
const monitor_1 = require("../types/monitor");
const config_parser_1 = require("../util/config-parser");
const config_1 = require("../config/config");
class MonitorLoop {
    constructor(monitor, serverPath, checkIntervall, stateListener) {
        this.monitor = monitor;
        this.serverPath = serverPath;
        this.checkIntervall = checkIntervall;
        this.stateListener = stateListener;
        this.loopInterval = 500;
        this.lastTick = 0;
        this.log = new logger_1.Logger('Monitor');
        this.processes = new processes_1.Processes();
        this.watching = false;
        this.skipping = false;
        this.initialStart = true;
        this.lastServerUsages = [];
        this.lockPath = path.join(serverPath, 'RESTART_LOCK');
    }
    set restartLock(lock) {
        this.skipping = lock;
    }
    get restartLock() {
        return this.skipping;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.watching)
                return;
            this.watching = true;
            void this.loop();
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.watching)
                return;
            this.watching = false;
        });
    }
    loop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.lastTick = 0;
            while (this.watching) {
                if ((new Date().valueOf() - this.lastTick) > this.checkIntervall) {
                    yield this.tick();
                    this.lastTick = new Date().valueOf();
                }
                yield new Promise((r) => setTimeout(r, this.loopInterval));
            }
        });
    }
    tick() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let needsRestart = true;
                // User locked the server manually
                if (needsRestart && fs.existsSync(this.lockPath)) {
                    this.log.log(logger_1.LogLevel.IMPORTANT, 'Detected manual server lockfile. Skipping server check');
                    needsRestart = false;
                }
                // restart locked
                if (needsRestart && this.skipping) {
                    this.log.log(logger_1.LogLevel.IMPORTANT, 'Detected server restart lock state. Skipping server check');
                    needsRestart = false;
                }
                // server running
                if (yield this.monitor.isServerRunning()) {
                    needsRestart = false;
                    this.initialStart = false;
                    this.log.log(logger_1.LogLevel.INFO, 'Server running...');
                    this.stateListener(monitor_1.ServerState.STARTED);
                }
                else {
                    this.stateListener(monitor_1.ServerState.STOPPED);
                }
                if (needsRestart) {
                    this.log.log(logger_1.LogLevel.IMPORTANT, 'Server not found. Starting...');
                    this.stateListener(monitor_1.ServerState.STARTING);
                    yield this.monitor.startServer(this.initialStart);
                    this.lastServerUsages = [];
                    this.initialStart = false;
                    // give the server a minute to start up
                    this.skipLoop(60000);
                }
                else {
                    yield this.checkPossibleStuckState();
                }
            }
            catch (e) {
                this.log.log(logger_1.LogLevel.ERROR, 'Error during server monitor loop', e);
            }
        });
    }
    checkPossibleStuckState() {
        return __awaiter(this, void 0, void 0, function* () {
            const processes = yield this.monitor.getDayZProcesses();
            // no processes found, also means no process to be stuck
            if (!(processes === null || processes === void 0 ? void 0 : processes.length)) {
                this.lastServerUsages = [];
                return;
            }
            if (this.lastServerUsages.length >= 5) {
                this.lastServerUsages.shift();
            }
            this.lastServerUsages.push(this.processes.getProcessCPUSpent(processes[0]));
            if (this.lastServerUsages.length >= 5) {
                let avg = 0;
                for (const usage of this.lastServerUsages) {
                    avg += usage;
                }
                avg /= this.lastServerUsages.length;
                // if the process spends very little cpu time, it probably stuck
                if (this.lastServerUsages.every((x) => (Math.abs(avg - x) < 3))) {
                    const msg = 'WARNING: Server possibly got stuck!';
                    this.log.log(logger_1.LogLevel.WARN, msg);
                    void this.monitor.manager.discord.relayRconMessage(msg);
                }
            }
        });
    }
    skipLoop(forTime) {
        this.lastTick = new Date().valueOf() + (forTime !== null && forTime !== void 0 ? forTime : 30000);
    }
}
exports.MonitorLoop = MonitorLoop;
class Monitor {
    constructor(manager) {
        this.manager = manager;
        this.log = new logger_1.Logger('Monitor');
        this.processes = new processes_1.Processes();
        this.paths = new paths_1.Paths();
        this.$internalServerState = monitor_1.ServerState.STOPPED;
        this.stateListeners = new Map();
    }
    get internalServerState() {
        return this.$internalServerState;
    }
    set internalServerState(state) {
        if (this.$internalServerState === state)
            return;
        // prevent intermediate state change
        if (state === monitor_1.ServerState.STARTED
            && (this.$internalServerState === monitor_1.ServerState.STOPPING)) {
            // TODO force resume after this occurs multiple times?
            return;
        }
        // msg about server startup
        if (state === monitor_1.ServerState.STARTED
            && (this.$internalServerState === monitor_1.ServerState.STARTING)) {
            void this.manager.discord.relayRconMessage('Server start sucessful');
        }
        // handle stop after running
        if (state === monitor_1.ServerState.STOPPED
            && (this.$internalServerState === monitor_1.ServerState.STARTING
                || this.$internalServerState === monitor_1.ServerState.STARTED)) {
            const msg = 'Detected possible server crash. Restarting...';
            this.log.log(logger_1.LogLevel.WARN, msg);
            void this.manager.discord.relayRconMessage(msg);
        }
        this.$internalServerState = state;
        this.stateListeners.forEach((x) => {
            try {
                x(state);
            }
            catch (_a) { }
        });
    }
    get serverState() {
        return this.internalServerState;
    }
    set restartLock(lock) {
        this.watcher.restartLock = lock;
    }
    get restartLock() {
        return this.watcher.restartLock;
    }
    registerStateListener(id, stateListener) {
        this.stateListeners.set(id, stateListener);
    }
    removeStateListener(id) {
        if (this.stateListeners.has(id)) {
            this.stateListeners.delete(id);
        }
    }
    createWatcher() {
        return new MonitorLoop(this, this.manager.getServerPath(), this.manager.config.serverProcessPollIntervall, (state) => {
            this.internalServerState = state;
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.watcher)
                return;
            this.watcher = this.createWatcher();
            yield this.watcher.start();
            this.log.log(logger_1.LogLevel.IMPORTANT, 'Starting to watch server');
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.watcher)
                return;
            yield this.watcher.stop();
            this.watcher = undefined;
            this.stateListeners.clear();
            this.log.log(logger_1.LogLevel.IMPORTANT, 'Stoping to watch server');
        });
    }
    isServerRunning() {
        return __awaiter(this, void 0, void 0, function* () {
            const processes = yield this.getDayZProcesses();
            return processes.length > 0;
        });
    }
    killServer(force) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.internalServerState === monitor_1.ServerState.STARTING || this.serverState === monitor_1.ServerState.STARTED) {
                this.internalServerState = monitor_1.ServerState.STOPPING;
            }
            if (force || !((_a = this.manager.rcon) === null || _a === void 0 ? void 0 : _a.isConnected())) {
                const processes = yield this.getDayZProcesses();
                const success = yield Promise.all((_b = processes === null || processes === void 0 ? void 0 : processes.map((x) => {
                    return (() => __awaiter(this, void 0, void 0, function* () {
                        try {
                            yield this.processes.killProcess(x.ProcessId, force);
                            return true;
                        }
                        catch (err) {
                            this.log.log(logger_1.LogLevel.ERROR, `Failed to kill process ${x.ProcessId}: ${err.status}`, err.stdout, err.stderr);
                        }
                        return false;
                    }))();
                })) !== null && _b !== void 0 ? _b : []);
                return success.every((x) => x);
            }
            return this.manager.rcon.shutdown().then(() => true, () => false);
        });
    }
    writeServerCfg() {
        return __awaiter(this, void 0, void 0, function* () {
            const cfgPath = path.join(this.manager.getServerPath(), this.manager.config.serverCfgPath);
            const content = new config_parser_1.ConfigParser().json2cfg(this.manager.config.serverCfg);
            this.log.log(logger_1.LogLevel.INFO, `Writing server cfg`);
            fs.writeFileSync(cfgPath, content);
        });
    }
    prepareServerStart(skipPrep) {
        var _a, _b, _c, _d, _e, _f, _g;
        return __awaiter(this, void 0, void 0, function* () {
            // ingame report
            yield this.manager.ingameReport.installMod();
            // battleye / rcon
            yield this.manager.rcon.createBattleyeConf();
            yield this.writeServerCfg();
            if (!!skipPrep) {
                return;
            }
            // Server
            if (!(yield ((_a = this.manager.steamCmd) === null || _a === void 0 ? void 0 : _a.checkServer())) || this.manager.config.updateServerBeforeServerStart) {
                yield ((_b = this.manager.steamCmd) === null || _b === void 0 ? void 0 : _b.updateServer());
            }
            if (!(yield ((_c = this.manager.steamCmd) === null || _c === void 0 ? void 0 : _c.checkServer()))) {
                throw new Error('Server installation failed');
            }
            // Mods
            if (!(yield ((_d = this.manager.steamCmd) === null || _d === void 0 ? void 0 : _d.checkMods())) || this.manager.config.updateModsBeforeServerStart) {
                if (!(yield ((_e = this.manager.steamCmd) === null || _e === void 0 ? void 0 : _e.updateMods()))) {
                    throw new Error('Mod update failed');
                }
            }
            if (!(yield ((_f = this.manager.steamCmd) === null || _f === void 0 ? void 0 : _f.installMods()))) {
                throw new Error('Mod installation failed');
            }
            if (!(yield ((_g = this.manager.steamCmd) === null || _g === void 0 ? void 0 : _g.checkMods()))) {
                throw new Error('Mod installation failed');
            }
            // env requirements
            yield this.manager.requirements.checkWinErrorReporting();
            yield this.manager.requirements.checkFirewall();
        });
    }
    buildStartServerArgs() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
        const args = [
            '/c', 'start',
            '/D', this.manager.getServerPath(),
            this.manager.config.serverExe,
            `-config=${this.manager.config.serverCfgPath}`,
            `-port=${this.manager.config.serverPort}`,
            `-profiles=${this.manager.config.profilesPath}`,
        ];
        const modList = [
            ...((_b = (_a = this.manager.steamCmd) === null || _a === void 0 ? void 0 : _a.buildWsModParams()) !== null && _b !== void 0 ? _b : []),
            ...((_d = (_c = this.manager.config) === null || _c === void 0 ? void 0 : _c.localMods) !== null && _d !== void 0 ? _d : []),
        ];
        if (modList === null || modList === void 0 ? void 0 : modList.length) {
            args.push(`-mod=${modList.join(';')}`);
        }
        // Ingame Reporting Addon
        const serverMods = [
            ...(this.manager.ingameReport.getServerMods()),
            ...((_f = (_e = this.manager.config) === null || _e === void 0 ? void 0 : _e.serverMods) !== null && _f !== void 0 ? _f : []),
        ];
        if (serverMods === null || serverMods === void 0 ? void 0 : serverMods.length) {
            args.push(`-servermod=${serverMods.join(';')}`);
        }
        if ((_g = this.manager.config) === null || _g === void 0 ? void 0 : _g.adminLog) {
            args.push('-adminlog');
        }
        if ((_h = this.manager.config) === null || _h === void 0 ? void 0 : _h.doLogs) {
            args.push('-dologs');
        }
        if ((_j = this.manager.config) === null || _j === void 0 ? void 0 : _j.filePatching) {
            args.push('-filePatching');
        }
        if ((_k = this.manager.config) === null || _k === void 0 ? void 0 : _k.freezeCheck) {
            args.push('-freezecheck');
        }
        const limitFPS = (_m = (_l = this.manager.config) === null || _l === void 0 ? void 0 : _l.limitFPS) !== null && _m !== void 0 ? _m : 0;
        if (limitFPS > 0 && limitFPS < 200) {
            args.push(`-limitFPS=${limitFPS}`);
        }
        const cpuCount = (_p = (_o = this.manager.config) === null || _o === void 0 ? void 0 : _o.cpuCount) !== null && _p !== void 0 ? _p : 0;
        if (cpuCount && cpuCount > 0) {
            args.push(`-cpuCount=${cpuCount}`);
        }
        if ((_q = this.manager.config) === null || _q === void 0 ? void 0 : _q.netLog) {
            args.push('-netLog');
        }
        if ((_r = this.manager.config) === null || _r === void 0 ? void 0 : _r.scrAllowFileWrite) {
            args.push('-scrAllowFileWrite');
        }
        if ((_s = this.manager.config) === null || _s === void 0 ? void 0 : _s.scriptDebug) {
            args.push('-scriptDebug');
        }
        if ((_u = (_t = this.manager.config) === null || _t === void 0 ? void 0 : _t.serverLaunchParams) === null || _u === void 0 ? void 0 : _u.length) {
            args.push(...(_v = this.manager.config) === null || _v === void 0 ? void 0 : _v.serverLaunchParams);
        }
        return args;
    }
    startServer(skipPrep) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((res, rej) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.prepareServerStart(skipPrep);
                    yield this.manager.hooks.executeHooks(config_1.HookTypeEnum.beforeStart);
                    const args = this.buildStartServerArgs();
                    const sub = child_process_1.spawn('cmd', args, {
                        detached: true,
                        stdio: 'ignore',
                    });
                    sub.on('error', (e) => {
                        this.log.log(logger_1.LogLevel.IMPORTANT, 'Error while trying to start server', e);
                        res(false);
                    });
                    sub.on('exit', (code) => {
                        res(code === 0);
                    });
                }
                catch (e) {
                    rej(e);
                }
            }));
        });
    }
    getDayZProcesses() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let processList = [];
            if (((_a = this.lastServerCheckResult) === null || _a === void 0 ? void 0 : _a.ts) && (new Date().valueOf() - ((_b = this.lastServerCheckResult) === null || _b === void 0 ? void 0 : _b.ts)) < 1000) {
                processList = this.lastServerCheckResult.result;
            }
            else {
                processList = yield this.processes.getProcessList();
                this.log.log(logger_1.LogLevel.DEBUG, 'Fetched new Process list', processList
                    .filter((x) => this.paths.samePath(x === null || x === void 0 ? void 0 : x.ExecutablePath, this.manager.getServerExePath())));
                this.lastServerCheckResult = {
                    ts: new Date().valueOf(),
                    result: processList,
                };
            }
            return processList
                .filter((x) => this.paths.samePath(x === null || x === void 0 ? void 0 : x.ExecutablePath, this.manager.getServerExePath()))
                .map((x) => {
                if (x.CreationDate) {
                    const y = x.CreationDate.substr(0, 4);
                    const m = x.CreationDate.substr(4, 2);
                    const d = x.CreationDate.substr(6, 2);
                    const hour = x.CreationDate.substr(8, 2);
                    const minute = x.CreationDate.substr(10, 2);
                    const second = x.CreationDate.substr(12, 2);
                    return Object.assign(Object.assign({}, x), { 
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        CreationDate: `${y}-${m}-${d} ${hour}:${minute}:${second}` });
                }
                return x;
            });
        });
    }
    getSystemReport() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let prevReport = null;
                const metrics = yield this.manager.metrics.fetchMetrics('SYSTEM', new Date().valueOf() - (15 * 60 * 1000));
                if (metrics.length) {
                    prevReport = metrics[metrics.length - 1];
                }
                const system = this.processes.getSystemUsage();
                let busy = 0;
                let idle = 0;
                const eachCPU = system.cpu.map((cpu) => {
                    const t = cpu.times;
                    const cpuBusy = t.user + t.nice + t.sys + t.irq;
                    idle += t.idle;
                    busy += cpuBusy;
                    return Math.round((cpuBusy / (t.idle + cpuBusy)) * 100);
                });
                let interval = busy + idle;
                let used = busy;
                if (((_b = (_a = prevReport === null || prevReport === void 0 ? void 0 : prevReport.value) === null || _a === void 0 ? void 0 : _a.system) === null || _b === void 0 ? void 0 : _b.cpuSpent) && ((_d = (_c = prevReport === null || prevReport === void 0 ? void 0 : prevReport.value) === null || _c === void 0 ? void 0 : _c.system) === null || _d === void 0 ? void 0 : _d.uptime)) {
                    interval -= prevReport.value.system.uptime;
                    used -= prevReport.value.system.cpuSpent;
                }
                const report = new monitor_1.SystemReport();
                report.system = {
                    cpuTotal: Math.round((used / interval) * 100),
                    cpuSpent: busy,
                    uptime: busy + idle,
                    cpuEach: eachCPU,
                    mem: Math.floor((system.memTotal - system.memFree) / 1024 / 1024),
                    memTotal: Math.floor(system.memTotal / 1024 / 1024),
                };
                report.serverState = this.serverState;
                const processCpu = process.cpuUsage();
                const processUp = process.uptime();
                let processInterval = processUp;
                let processUsed = (processCpu.system + processCpu.user) / 1000000;
                if (((_f = (_e = prevReport === null || prevReport === void 0 ? void 0 : prevReport.value) === null || _e === void 0 ? void 0 : _e.manager) === null || _f === void 0 ? void 0 : _f.cpuSpent) && ((_h = (_g = prevReport === null || prevReport === void 0 ? void 0 : prevReport.value) === null || _g === void 0 ? void 0 : _g.manager) === null || _h === void 0 ? void 0 : _h.uptime)) {
                    processInterval -= prevReport.value.manager.uptime;
                    processUsed -= prevReport.value.manager.cpuSpent;
                }
                report.manager = {
                    cpuTotal: Math.round((processUsed / processInterval) * 100),
                    cpuSpent: processCpu.system + processCpu.user,
                    uptime: processUp,
                    mem: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024),
                };
                if (this.serverState === monitor_1.ServerState.STARTED) {
                    const processes = yield this.getDayZProcesses();
                    if (processes === null || processes === void 0 ? void 0 : processes.length) {
                        report.server = {
                            cpuTotal: this.processes.getProcessCPUUsage(processes[0]),
                            cpuSpent: this.processes.getProcessCPUSpent(processes[0]),
                            uptime: this.processes.getProcessUptime(processes[0]),
                            mem: Math.floor(Number(processes[0].PrivatePageCount) / 1024 / 1024),
                        };
                    }
                }
                return report;
            }
            catch (e) {
                this.log.log(logger_1.LogLevel.ERROR, 'Error building system report', e);
                return null;
            }
        });
    }
}
exports.Monitor = Monitor;
//# sourceMappingURL=monitor.js.map