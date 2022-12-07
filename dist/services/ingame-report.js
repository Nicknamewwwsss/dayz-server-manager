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
exports.IngameReport = void 0;
const metrics_1 = require("../types/metrics");
const path = require("path");
const fs = require("fs");
const paths_1 = require("../util/paths");
const logger_1 = require("../util/logger");
class IngameReport {
    constructor(manager) {
        this.manager = manager;
        this.MOD_NAME = '@DayZServerManager';
        this.MOD_NAME_EXPANSION = '@DayZServerManagerExpansion';
        this.TICK_FILE = 'DZSM-TICK.json';
        this.EXPANSION_VEHICLES_MOD_ID = '2291785437';
        this.log = new logger_1.Logger('IngameReport');
        this.paths = new paths_1.Paths();
        this.intervalTimeout = 1000;
        this.readTimeout = 1000;
        this.lastTickTimestamp = 0;
    }
    start() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const baseDir = this.manager.getServerPath();
            const profiles = (_a = this.manager.config) === null || _a === void 0 ? void 0 : _a.profilesPath;
            if (profiles) {
                if (path.isAbsolute(profiles)) {
                    this.tickFilePath = path.join(profiles, this.TICK_FILE);
                }
                else {
                    this.tickFilePath = path.join(baseDir, profiles, this.TICK_FILE);
                }
            }
            this.interval = setInterval(() => {
                void this.scanTick();
            }, this.intervalTimeout);
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = undefined;
            }
        });
    }
    scanTick() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (fs.existsSync(this.tickFilePath)) {
                    const stat = fs.statSync(this.tickFilePath);
                    const modified = stat.mtime.getTime();
                    if (modified !== this.lastTickTimestamp) {
                        this.lastTickTimestamp = modified;
                        yield new Promise((r) => setTimeout(r, this.readTimeout));
                        const content = `${fs.readFileSync(this.tickFilePath)}`;
                        const parsed = JSON.parse(content);
                        yield this.processIngameReport(parsed);
                    }
                }
            }
            catch (e) {
                this.log.log(logger_1.LogLevel.ERROR, `Error trying to scan for ingame report file`, e);
            }
        });
    }
    processIngameReport(report) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            const timestamp = new Date().valueOf();
            this.log.log(logger_1.LogLevel.INFO, `Server sent ingame report: ${(_b = (_a = report === null || report === void 0 ? void 0 : report.players) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0} players, ${(_d = (_c = report === null || report === void 0 ? void 0 : report.vehicles) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0} vehicles`);
            void this.manager.metrics.pushMetricValue(metrics_1.MetricTypeEnum.INGAME_PLAYERS, {
                timestamp,
                value: (_e = report === null || report === void 0 ? void 0 : report.players) !== null && _e !== void 0 ? _e : [],
            });
            void this.manager.metrics.pushMetricValue(metrics_1.MetricTypeEnum.INGAME_VEHICLES, {
                timestamp,
                value: (_f = report === null || report === void 0 ? void 0 : report.vehicles) !== null && _f !== void 0 ? _f : [],
            });
        });
    }
    installMod() {
        return __awaiter(this, void 0, void 0, function* () {
            const serverPath = this.manager.getServerPath();
            const modsPath = path.join(__dirname, '../mods');
            const mods = fs.readdirSync(modsPath);
            for (const mod of mods) {
                const serverModPath = path.join(serverPath, mod);
                if (fs.existsSync(serverModPath)) {
                    if (!this.paths.removeLink(serverModPath)) {
                        this.log.log(logger_1.LogLevel.ERROR, `Could not remove mod ${mod} before copying new files`);
                        return;
                    }
                }
            }
            this.paths.copyFromPkg(modsPath, serverPath);
        });
    }
    getServerMods() {
        const mods = [this.MOD_NAME];
        if (this.manager.getModIdList().includes(this.EXPANSION_VEHICLES_MOD_ID)) {
            mods.push(this.MOD_NAME_EXPANSION);
        }
        return mods;
    }
}
exports.IngameReport = IngameReport;
//# sourceMappingURL=ingame-report.js.map