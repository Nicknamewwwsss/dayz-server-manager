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
exports.SteamCMD = void 0;
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const paths_1 = require("../util/paths");
const processes_1 = require("../util/processes");
const download_1 = require("../util/download");
const logger_1 = require("../util/logger");
const compare_folders_1 = require("../util/compare-folders");
class SteamCMD {
    constructor(manager) {
        this.manager = manager;
        // time to wait after the zip has been extracted (to avoid errors)
        this.extractDelay = 5000;
        this.log = new logger_1.Logger('SteamCMD');
        this.paths = new paths_1.Paths();
        this.processes = new processes_1.Processes();
        this.progressLog = true;
    }
    getCmdPath() {
        var _a, _b;
        let cmdFolder = (_b = (_a = this.manager.config) === null || _a === void 0 ? void 0 : _a.steamCmdPath) !== null && _b !== void 0 ? _b : '';
        if (!path.isAbsolute(cmdFolder)) {
            cmdFolder = path.join(this.paths.cwd(), cmdFolder);
        }
        return path.join(cmdFolder, 'steamcmd.exe');
    }
    downloadSteamCmd() {
        return __awaiter(this, void 0, void 0, function* () {
            const cmdPath = path.dirname(this.getCmdPath());
            const zipPath = path.join(cmdPath, 'steamcmd.zip');
            try {
                yield download_1.download('https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip', zipPath);
                this.log.log(logger_1.LogLevel.IMPORTANT, 'Download of SteamCMD done');
            }
            catch (e) {
                this.log.log(logger_1.LogLevel.ERROR, 'Failed to download SteamCMD', e);
                if (fs.existsSync(zipPath)) {
                    fs.unlinkSync(zipPath);
                }
                return false;
            }
            try {
                yield download_1.extractZip(zipPath, { dir: path.resolve(cmdPath) });
                this.log.log(logger_1.LogLevel.IMPORTANT, 'Extraction of SteamCMD done');
            }
            catch (e) {
                this.log.log(logger_1.LogLevel.ERROR, 'Failed to extract SteamCMD', e);
                if (fs.existsSync(zipPath)) {
                    fs.unlinkSync(zipPath);
                }
                return false;
            }
            if (fs.existsSync(zipPath)) {
                fs.unlinkSync(zipPath);
            }
            // wait for the exe not to be 'busy'
            yield new Promise((r) => setTimeout(r, this.extractDelay));
            return true;
        });
    }
    installSteamCmd() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.log(logger_1.LogLevel.IMPORTANT, 'Checking/Installing SteamCMD');
            return this.execute(['validate', '+quit']);
        });
    }
    checkSteamCmd() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const cmdFolder = (_a = this.manager.config) === null || _a === void 0 ? void 0 : _a.steamCmdPath;
            if (!cmdFolder) {
                return false;
            }
            if (!fs.existsSync(this.getCmdPath())) {
                if (!(yield this.downloadSteamCmd())) {
                    return false;
                }
            }
            return this.installSteamCmd();
        });
    }
    getLoginArgs() {
        var _a;
        return [
            '+login',
            this.manager.config.steamUsername,
            (_a = this.manager.config.steamPassword) !== null && _a !== void 0 ? _a : '',
        ];
    }
    execute(args) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let retries = 3;
            while (retries >= 0) {
                try {
                    yield this.processes.spawnForOutput(this.getCmdPath(), args, {
                        verbose: this.progressLog,
                        ignoreCodes: [
                            6,
                            7, // no command
                        ],
                        spawnOpts: {
                            cwd: (_a = this.manager.config) === null || _a === void 0 ? void 0 : _a.steamCmdPath,
                            stdio: [
                                'inherit',
                                'inherit',
                                'inherit',
                            ],
                        },
                    });
                    return true;
                }
                catch (e) {
                    const argsStr = args.map((x) => ((x === this.manager.config.steamPassword) ? '******' : x)).join(' ');
                    if (e.status === 10 && retries > 1) {
                        // timeout && some retries left
                        retries--;
                        this.log.log(logger_1.LogLevel.INFO, `Retrying "${argsStr}" because of timeout`);
                    }
                    else {
                        this.log.log(logger_1.LogLevel.ERROR, `SteamCMD "${argsStr}" failed`, e);
                        if (!this.progressLog) {
                            this.log.log(logger_1.LogLevel.INFO, e.stdout);
                            this.log.log(logger_1.LogLevel.ERROR, e.stderr);
                        }
                        return false;
                    }
                }
            }
            return false;
        });
    }
    checkServer() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const serverFolder = this.manager.getServerPath();
            const serverExe = (_a = this.manager.config) === null || _a === void 0 ? void 0 : _a.serverExe;
            return !!serverFolder && !!serverExe
                && fs.existsSync(path.join(serverFolder, serverExe));
        });
    }
    updateServer() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const serverPath = this.manager.getServerPath();
            fse.ensureDirSync(serverPath);
            const success = yield this.execute([
                ...this.getLoginArgs(),
                '+force_install_dir',
                serverPath,
                '+app_update',
                (((_a = this.manager.config) === null || _a === void 0 ? void 0 : _a.experimentalServer) ? SteamCMD.DAYZ_EXPERIMENTAL_SERVER_APP_ID : SteamCMD.DAYZ_SERVER_APP_ID),
                'validate',
                '+quit',
            ]);
            if (!success) {
                this.log.log(logger_1.LogLevel.ERROR, 'Failed to update server');
                return false;
            }
            return this.checkServer();
        });
    }
    getWsBasePath() {
        let wsPath = this.manager.config.steamWorkshopPath;
        if (!path.isAbsolute(wsPath)) {
            wsPath = path.join(this.paths.cwd(), wsPath);
        }
        return wsPath;
    }
    getWsPath() {
        return path.join(this.getWsBasePath(), 'steamapps/workshop/content', SteamCMD.DAYZ_APP_ID);
    }
    getWsModName(modId) {
        var _a, _b, _c, _d;
        const wsPath = this.getWsPath();
        const modMeta = path.join(wsPath, modId, 'meta.cpp');
        if (!fs.existsSync(modMeta)) {
            return '';
        }
        const metaContent = fs.readFileSync(modMeta).toString();
        const names = (_a = metaContent.match(/name[\s]*=.*/g)) !== null && _a !== void 0 ? _a : [];
        const modName = (_d = (_c = (_b = names.pop()) === null || _b === void 0 ? void 0 : _b.split('=')[1]) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : '';
        if (modName) {
            return '@' + modName
                .replace(/\//g, '-')
                .replace(/\\/g, '-')
                .replace(/ /g, '-')
                .replace(/[^a-zA-Z0-9\-_]/g, '');
        }
        return '';
    }
    buildWsModParams() {
        return this.manager.getModIdList()
            .map((x) => this.getWsModName(x));
    }
    updateMod(modId) {
        return __awaiter(this, void 0, void 0, function* () {
            const wsBasePath = this.getWsBasePath();
            fse.ensureDirSync(wsBasePath);
            const success = yield this.execute([
                ...this.getLoginArgs(),
                '+force_install_dir',
                wsBasePath,
                '+workshop_download_item',
                SteamCMD.DAYZ_APP_ID,
                modId,
                'validate',
                '+quit',
            ]);
            if (!success) {
                this.log.log(logger_1.LogLevel.ERROR, `Failed to update mod: ${modId}`);
                return false;
            }
            const modName = this.getWsModName(modId);
            return !!modName;
        });
    }
    updateMods() {
        return __awaiter(this, void 0, void 0, function* () {
            const modIds = this.manager.getModIdList();
            // single mod updates must be run synchronously
            // updating multiple mods at once increases the chance of timeouts
            // the retry would then cause the whole process to start all over
            for (const modId of modIds) {
                if (!(yield this.updateMod(modId))) {
                    return false;
                }
            }
            return true;
        });
    }
    sameModMeta(modDir, serverDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const modMeta = path.join(modDir, 'meta.cpp');
            const serverMeta = path.join(serverDir, 'meta.cpp');
            if (!fs.existsSync(modMeta)
                || !fs.existsSync(serverMeta)) {
                return false;
            }
            return `${fs.readFileSync(modMeta)}` === `${fs.readFileSync(serverMeta)}`;
        });
    }
    installMod(modId) {
        return __awaiter(this, void 0, void 0, function* () {
            const modName = this.getWsModName(modId);
            if (!modName) {
                return false;
            }
            const modDir = path.join(this.getWsPath(), modId);
            const serverDir = path.join(this.manager.getServerPath(), modName);
            if (this.manager.config.linkModDirs) {
                this.log.log(logger_1.LogLevel.INFO, `Linking mod (${modId}) dir`);
                if (!this.paths.linkDirsFromTo(modDir, serverDir)) {
                    this.log.log(logger_1.LogLevel.ERROR, `Linking mod (${modId}) dir failed`);
                    return false;
                }
            }
            else {
                let isUp2Date = false;
                if (!isUp2Date
                    && this.manager.config.copyModDeepCompare
                    && (yield compare_folders_1.sameDirHash(modDir, serverDir))) {
                    isUp2Date = true;
                }
                if (!isUp2Date
                    && !this.manager.config.copyModDeepCompare) {
                    isUp2Date = yield this.sameModMeta(modDir, serverDir);
                }
                if (isUp2Date) {
                    this.log.log(logger_1.LogLevel.INFO, `Skipping copy of mod (${modId}) dir because its already up to date`);
                }
                else {
                    this.log.log(logger_1.LogLevel.INFO, `Copying mod (${modId}) dir`);
                    if (!(yield this.paths.copyDirFromTo(modDir, serverDir))) {
                        this.log.log(logger_1.LogLevel.ERROR, `Copying mod (${modId}) dir failed`);
                        return false;
                    }
                }
            }
            return this.copyModKeys(modId);
        });
    }
    installMods() {
        return __awaiter(this, void 0, void 0, function* () {
            const modIds = this.manager.getModIdList();
            return (yield Promise.all(modIds.map((modId) => {
                return this.installMod(modId);
            }))).every((x) => x);
        });
    }
    copyModKeys(modId) {
        return __awaiter(this, void 0, void 0, function* () {
            const keysFolder = path.join(this.manager.getServerPath(), 'keys');
            const modName = this.getWsModName(modId);
            const modDir = path.join(this.getWsPath(), modId);
            this.log.log(logger_1.LogLevel.DEBUG, `Searching keys for ${modName}`);
            const keys = yield this.paths.findFilesInDir(modDir, /.*\.bikey/g);
            for (const key of keys) {
                const keyName = path.basename(key);
                this.log.log(logger_1.LogLevel.INFO, `Copying ${modName} key ${keyName}`);
                const target = path.join(keysFolder, keyName);
                if (fs.existsSync(target)) {
                    fs.unlinkSync(target);
                }
                yield fs.promises.copyFile(key, target);
            }
            return true;
        });
    }
    checkMods() {
        return __awaiter(this, void 0, void 0, function* () {
            const wsPath = this.getWsPath();
            return this.manager.getModIdList()
                .every((modId) => {
                const modDir = path.join(wsPath, modId);
                if (!fs.existsSync(modDir)) {
                    this.log.log(logger_1.LogLevel.ERROR, `Mod ${modId} was not found`);
                    return false;
                }
                const modName = this.getWsModName(modId);
                if (!modName) {
                    this.log.log(logger_1.LogLevel.ERROR, `Modname for ${modId} was not found`);
                    return false;
                }
                const modServerDir = path.join(this.manager.getServerPath(), modName);
                if (!fs.existsSync(modServerDir)) {
                    this.log.log(logger_1.LogLevel.ERROR, `Mod Link for ${modName} was not found`);
                    return false;
                }
                return true;
            });
        });
    }
}
exports.SteamCMD = SteamCMD;
SteamCMD.DAYZ_APP_ID = '221100';
SteamCMD.DAYZ_SERVER_APP_ID = '223350';
SteamCMD.DAYZ_EXPERIMENTAL_SERVER_APP_ID = '1042420';
//# sourceMappingURL=steamcmd.js.map