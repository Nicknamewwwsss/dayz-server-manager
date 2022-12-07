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
exports.MissionFiles = void 0;
const logger_1 = require("../util/logger");
const path = require("path");
const fse = require("fs-extra");
const config_1 = require("../config/config");
class MissionFiles {
    constructor(manager) {
        this.manager = manager;
        this.log = new logger_1.Logger('MissionFiles');
    }
    getMissionPath() {
        return path.resolve(path.join(this.manager.getServerPath(), 'mpmissions', this.manager.config.serverCfg.Missions.DayZ.template));
    }
    readMissionFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const missionPath = this.getMissionPath();
            const filePath = path.resolve(path.join(missionPath, file));
            if (!filePath.startsWith(missionPath)) {
                return null;
            }
            return String(yield fse.readFile(filePath));
        });
    }
    readMissionDir(dir) {
        return __awaiter(this, void 0, void 0, function* () {
            const missionPath = this.getMissionPath();
            const filePath = path.resolve(path.join(missionPath, dir));
            if (!filePath.startsWith(missionPath)) {
                return [];
            }
            return (yield (fse.readdir(filePath, { withFileTypes: true })))
                .map((x) => {
                if (x.isDirectory() && !x.name.endsWith('/')) {
                    return `${x.name}/`;
                }
                return x.name;
            });
        });
    }
    writeMissionFile(file, content, createBackup) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!file || !content) {
                return;
            }
            const missionPath = this.getMissionPath();
            const filePath = path.resolve(path.join(missionPath, file));
            if (!filePath.startsWith(missionPath)) {
                return null;
            }
            if (createBackup) {
                yield this.manager.backup.createBackup();
            }
            yield fse.ensureDir(path.dirname(filePath));
            yield fse.writeFile(filePath, content);
            yield this.manager.hooks.executeHooks(config_1.HookTypeEnum.missionChanged);
        });
    }
}
exports.MissionFiles = MissionFiles;
//# sourceMappingURL=mission-files.js.map