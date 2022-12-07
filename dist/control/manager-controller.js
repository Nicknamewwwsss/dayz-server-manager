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
exports.ManagerController = exports.isRunFromWindowsGUI = void 0;
require("reflect-metadata");
const manager_1 = require("./manager");
const logger_1 = require("../util/logger");
const chokidar = require("chokidar");
const crypto = require("crypto");
const fs = require("fs");
const childProcess = require("child_process");
const isRunFromWindowsGUI = () => {
    var _a, _b, _c;
    if (process.platform !== 'win32') {
        return false;
    }
    // eslint-disable-next-line prefer-template
    const stdout = (childProcess.spawnSync('cmd', [
        '/c',
        [
            'wmic',
            'process',
            'get',
            'Name,ProcessId',
            '/VALUE',
        ].join(' '),
    ]).stdout + '')
        .replace(/\r/g, '')
        .split('\n\n')
        .filter((x) => !!x)
        .map((x) => x
        .split('\n')
        .filter((y) => !!y)
        .map((y) => {
        const equalIdx = y.indexOf('=');
        return [y.slice(0, equalIdx).trim(), y.slice(equalIdx + 1).trim()];
    }))
        .filter((x) => x[1][1] === `${process.ppid}`);
    if (!(stdout === null || stdout === void 0 ? void 0 : stdout.length)) {
        return false;
    }
    const parentName = (_c = (_b = (_a = stdout[0]) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b[1]) === null || _c === void 0 ? void 0 : _c.toLowerCase();
    return (parentName === 'ApplicationFrameHost.exe'.toLowerCase()
        || parentName === 'explorer.exe');
};
exports.isRunFromWindowsGUI = isRunFromWindowsGUI;
class ManagerController {
    constructor() {
        this.log = new logger_1.Logger('Manager');
        this.skipInitialCheck = false;
        process.on('unhandledRejection', (reason) => {
            console.error('Unhandled Rejection:', reason);
            // TODO save and report
        });
        process.on('exit', () => {
            // prevent imidiate exit if run in GUI
            if (exports.isRunFromWindowsGUI()) {
                childProcess.spawnSync('pause', {
                    shell: true,
                    stdio: [0, 1, 2],
                });
            }
        });
    }
    forEachManagerServices(cb) {
        return __awaiter(this, void 0, void 0, function* () {
            const services = Reflect.getMetadata('services', this.manager);
            for (const service of services) {
                const meta = Reflect.getMetadata('service', this.manager, service);
                if (meta) {
                    yield cb(this.manager, service, meta);
                }
            }
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configFileWatcher) {
                yield this.configFileWatcher.close();
                this.configFileWatcher = undefined;
            }
            if (this.manager) {
                this.log.log(logger_1.LogLevel.DEBUG, 'Stopping all running services..');
                yield this.forEachManagerServices((manager, service, config) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    if (config.stateful) {
                        this.log.log(logger_1.LogLevel.DEBUG, `Stopping ${service}..`);
                        yield ((_a = manager[service]) === null || _a === void 0 ? void 0 : _a.stop());
                    }
                }));
                this.log.log(logger_1.LogLevel.DEBUG, 'All running services stopped..');
                this.manager = undefined;
            }
        });
    }
    startCurrent() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.manager) {
                yield this.forEachManagerServices((manager, service, config) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    if (config.stateful) {
                        this.log.log(logger_1.LogLevel.DEBUG, `Starting ${service}..`);
                        yield ((_a = manager[service]) === null || _a === void 0 ? void 0 : _a.start());
                    }
                }));
            }
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            const manager = new manager_1.Manager();
            const config = manager.configHelper.readConfig();
            if (!config) {
                throw new Error(`Config missing or invalid`);
            }
            this.configFileHash = crypto.createHash('md5')
                .update(JSON.stringify(config))
                .digest('hex');
            yield this.stop();
            this.manager = manager;
            manager.applyConfig(config);
            const { loglevel } = config;
            if (typeof loglevel === 'number' && loglevel >= logger_1.LogLevel.DEBUG && loglevel <= logger_1.LogLevel.ERROR) {
                logger_1.Logger.defaultLogLevel = this.manager.config.loglevel;
            }
            process.title = `Server-Manager ${this.manager.getServerExePath()}`;
            this.log.log(logger_1.LogLevel.DEBUG, 'Setting up services..');
            yield this.forEachManagerServices((m, service, serviceConfig) => __awaiter(this, void 0, void 0, function* () {
                if (serviceConfig.type) {
                    this.log.log(logger_1.LogLevel.DEBUG, `Setting up service: ${service}`);
                    m[service] = new serviceConfig.type(m);
                }
            }));
            // init
            this.log.log(logger_1.LogLevel.DEBUG, 'Services are set up');
            try {
                // check firewall, but let the server boot if its not there (could be manually set to ports)
                yield this.manager.requirements.checkFirewall();
                // check runtime libs
                const vcRedistOk = yield this.manager.requirements.checkVcRedist();
                const directXOk = yield this.manager.requirements.checkDirectX();
                if (!vcRedistOk || !directXOk) {
                    this.log.log(logger_1.LogLevel.IMPORTANT, 'Install the missing runtime libs and restart the manager');
                    process.exit(0);
                }
                // check error reporting
                yield this.manager.requirements.checkWinErrorReporting();
                // eslint-disable-next-line no-negated-condition
                if (!this.skipInitialCheck && !(yield this.manager.monitor.isServerRunning())) {
                    this.log.log(logger_1.LogLevel.IMPORTANT, 'Initially checking SteamCMD, Server Installation and Mods. Please wait. This may take some minutes...');
                    const steamCmdOk = yield this.manager.steamCmd.checkSteamCmd();
                    if (!steamCmdOk) {
                        throw new Error('SteamCMD init failed');
                    }
                    // ingame report mod
                    yield this.manager.ingameReport.installMod();
                    // Server
                    if (!(yield this.manager.steamCmd.checkServer()) || this.manager.config.updateServerOnStartup) {
                        if (!(yield this.manager.steamCmd.updateServer())) {
                            throw new Error('Server installation failed');
                        }
                    }
                    if (!(yield this.manager.steamCmd.checkServer())) {
                        throw new Error('Server installation failed');
                    }
                    // Mods
                    if (!(yield this.manager.steamCmd.checkMods()) || this.manager.config.updateModsOnStartup) {
                        if (!(yield this.manager.steamCmd.updateMods())) {
                            throw new Error('Updating Mods failed');
                        }
                    }
                    if (!(yield this.manager.steamCmd.installMods())) {
                        throw new Error('Installing Mods failed');
                    }
                    if (!(yield this.manager.steamCmd.checkMods())) {
                        throw new Error('Mod installation failed');
                    }
                }
                else {
                    this.log.log(logger_1.LogLevel.IMPORTANT, 'Skipping initial SteamCMD check because the server is already running');
                }
                this.log.log(logger_1.LogLevel.DEBUG, 'Initial Check done. Starting Init..');
                yield this.startCurrent();
                this.manager.initDone = true;
                this.log.log(logger_1.LogLevel.IMPORTANT, 'Server Manager initialized successfully');
                this.log.log(logger_1.LogLevel.IMPORTANT, 'Waiting for first server monitor tick..');
                this.watchConfig();
            }
            catch (e) {
                this.log.log(logger_1.LogLevel.ERROR, e === null || e === void 0 ? void 0 : e.message, e);
                process.exit(1);
            }
        });
    }
    watchConfig() {
        const cfgPath = this.manager.configHelper.getConfigFilePath();
        this.configFileWatcher = chokidar.watch(cfgPath).on('change', () => __awaiter(this, void 0, void 0, function* () {
            // usually file "headers" are saved before content is done
            // waiting a small amount of time prevents reading RBW errors
            yield new Promise((r) => setTimeout(r, 1000));
            this.log.log(logger_1.LogLevel.INFO, 'Detected config file change...');
            if (!fs.existsSync(cfgPath)) {
                this.log.log(logger_1.LogLevel.ERROR, 'Cannot reload config because config file does not exist');
                return;
            }
            const config = this.manager.configHelper.readConfig();
            if (!config) {
                this.log.log(logger_1.LogLevel.ERROR, 'Cannot reload config because config contains errors');
                return;
            }
            const newHash = crypto.createHash('md5')
                .update(JSON.stringify(config))
                .digest('hex');
            if (newHash === this.configFileHash) {
                this.log.log(logger_1.LogLevel.WARN, 'Skipping config reload because no changes were found');
                return;
            }
            this.log.log(logger_1.LogLevel.IMPORTANT, 'Reloading config...');
            void this.start();
        }));
    }
}
exports.ManagerController = ManagerController;
ManagerController.INSTANCE = new ManagerController();
//# sourceMappingURL=manager-controller.js.map