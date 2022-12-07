"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
exports.Manager = void 0;
require("reflect-metadata");
const discord_1 = require("../services/discord");
const rest_1 = require("../interface/rest");
const rcon_1 = require("../services/rcon");
const fs = require("fs");
const steamcmd_1 = require("../services/steamcmd");
const paths_1 = require("../util/paths");
const path = require("path");
const monitor_1 = require("../services/monitor");
const metrics_1 = require("../services/metrics");
const interface_1 = require("../interface/interface");
const logger_1 = require("../util/logger");
const events_1 = require("../services/events");
const log_reader_1 = require("../services/log-reader");
const backups_1 = require("../services/backups");
const requirements_1 = require("../services/requirements");
const ingame_report_1 = require("../services/ingame-report");
const service_1 = require("../types/service");
const database_1 = require("../services/database");
const mission_files_1 = require("../services/mission-files");
const hooks_1 = require("../services/hooks");
const config_file_helper_1 = require("../config/config-file-helper");
class Manager {
    constructor() {
        this.log = new logger_1.Logger('Manager');
        this.paths = new paths_1.Paths();
        this.configHelper = new config_file_helper_1.ConfigFileHelper();
        this.initDone = false;
        this.initDone = false;
        const versionFilePath = path.join(__dirname, '../VERSION');
        if (fs.existsSync(versionFilePath)) {
            this.APP_VERSION = fs.readFileSync(versionFilePath).toString();
        }
        else {
            this.APP_VERSION = 'UNKNOWN';
        }
        this.log.log(logger_1.LogLevel.IMPORTANT, `Starting DZSM Version: ${this.APP_VERSION}`);
    }
    get config() {
        return this.config$;
    }
    applyConfig(config) {
        this.config$ = config;
    }
    getServerPath() {
        var _a, _b;
        const serverFolder = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.serverPath) !== null && _b !== void 0 ? _b : '';
        if (!serverFolder) {
            return path.join(this.paths.cwd(), 'DayZServer');
        }
        if (!path.isAbsolute(serverFolder)) {
            return path.join(this.paths.cwd(), serverFolder);
        }
        return serverFolder;
    }
    getServerExePath() {
        var _a, _b;
        return path.join(this.getServerPath(), ((_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.serverExe) !== null && _b !== void 0 ? _b : 'DayZServer_x64.exe'));
    }
    getUserLevel(userId) {
        var _a, _b, _c, _d;
        return (_d = (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.admins) === null || _b === void 0 ? void 0 : _b.find((x) => x.userId === userId)) === null || _c === void 0 ? void 0 : _c.userLevel) !== null && _d !== void 0 ? _d : null;
    }
    isUserOfLevel(userId, level) {
        if (!level) {
            return true;
        }
        const userLevel = this.getUserLevel(userId);
        if (!userLevel) {
            return false;
        }
        const levels = ['admin', 'manage', 'moderate', 'view'];
        return levels.includes(userLevel) && levels.indexOf(userLevel) <= levels.indexOf(level);
    }
    getWebPort() {
        var _a, _b;
        if (((_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.webPort) !== null && _b !== void 0 ? _b : 0) > 0) {
            return this.config.webPort;
        }
        return this.config.serverPort + 11;
    }
    getServerInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                name: this.config.serverCfg.hostname,
                port: this.config.serverPort,
                worldName: this.config.serverCfg.Missions.DayZ.template.split('.')[1],
                password: !!this.config.serverCfg.password,
                battleye: !!this.config.serverCfg.BattlEye,
                maxPlayers: this.config.serverCfg.maxPlayers,
            };
        });
    }
    getModIdList() {
        var _a, _b;
        return ((_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.steamWsMods) !== null && _b !== void 0 ? _b : [])
            .filter((x) => {
            if (typeof x === 'string') {
                return !!x;
            }
            return !!x.workshopId;
        })
            .map((x) => {
            if (typeof x === 'string') {
                return x;
            }
            return x.workshopId;
        });
    }
}
__decorate([
    service_1.Service({ type: interface_1.Interface, stateful: false }),
    __metadata("design:type", interface_1.Interface)
], Manager.prototype, "interface", void 0);
__decorate([
    service_1.Service({ type: rest_1.REST, stateful: true }),
    __metadata("design:type", rest_1.REST)
], Manager.prototype, "rest", void 0);
__decorate([
    service_1.Service({ type: discord_1.DiscordBot, stateful: true }),
    __metadata("design:type", discord_1.DiscordBot)
], Manager.prototype, "discord", void 0);
__decorate([
    service_1.Service({ type: rcon_1.RCON, stateful: true }),
    __metadata("design:type", rcon_1.RCON)
], Manager.prototype, "rcon", void 0);
__decorate([
    service_1.Service({ type: steamcmd_1.SteamCMD, stateful: false }),
    __metadata("design:type", steamcmd_1.SteamCMD)
], Manager.prototype, "steamCmd", void 0);
__decorate([
    service_1.Service({ type: monitor_1.Monitor, stateful: true }),
    __metadata("design:type", monitor_1.Monitor)
], Manager.prototype, "monitor", void 0);
__decorate([
    service_1.Service({ type: metrics_1.Metrics, stateful: true }),
    __metadata("design:type", metrics_1.Metrics)
], Manager.prototype, "metrics", void 0);
__decorate([
    service_1.Service({ type: events_1.Events, stateful: true }),
    __metadata("design:type", events_1.Events)
], Manager.prototype, "events", void 0);
__decorate([
    service_1.Service({ type: log_reader_1.LogReader, stateful: true }),
    __metadata("design:type", log_reader_1.LogReader)
], Manager.prototype, "logReader", void 0);
__decorate([
    service_1.Service({ type: backups_1.Backups, stateful: false }),
    __metadata("design:type", backups_1.Backups)
], Manager.prototype, "backup", void 0);
__decorate([
    service_1.Service({ type: requirements_1.Requirements, stateful: false }),
    __metadata("design:type", requirements_1.Requirements)
], Manager.prototype, "requirements", void 0);
__decorate([
    service_1.Service({ type: ingame_report_1.IngameReport, stateful: true }),
    __metadata("design:type", ingame_report_1.IngameReport)
], Manager.prototype, "ingameReport", void 0);
__decorate([
    service_1.Service({ type: database_1.Database, stateful: true }),
    __metadata("design:type", database_1.Database)
], Manager.prototype, "database", void 0);
__decorate([
    service_1.Service({ type: mission_files_1.MissionFiles, stateful: false }),
    __metadata("design:type", mission_files_1.MissionFiles)
], Manager.prototype, "missionFiles", void 0);
__decorate([
    service_1.Service({ type: hooks_1.Hooks, stateful: false }),
    __metadata("design:type", hooks_1.Hooks)
], Manager.prototype, "hooks", void 0);
exports.Manager = Manager;
//# sourceMappingURL=manager.js.map