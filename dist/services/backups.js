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
exports.Backups = void 0;
const logger_1 = require("../util/logger");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const paths_1 = require("../util/paths");
class Backups {
    constructor(manager) {
        this.manager = manager;
        this.log = new logger_1.Logger('Backups');
        this.paths = new paths_1.Paths();
    }
    createBackup() {
        return __awaiter(this, void 0, void 0, function* () {
            const backups = this.getBackupDir();
            yield fse.ensureDir(backups);
            const mpmissions = path.resolve(path.join(this.manager.getServerPath(), 'mpmissions'));
            if (!fs.existsSync(mpmissions)) {
                this.log.log(logger_1.LogLevel.WARN, 'Skipping backup because mpmissions folder does not exist');
                return;
            }
            const now = new Date();
            const curMarker = `mpmissions_${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
            this.log.log(logger_1.LogLevel.IMPORTANT, `Creating backup ${curMarker}`);
            const curBackup = path.join(backups, curMarker);
            yield fse.ensureDir(curBackup);
            yield fse.copy(mpmissions, curBackup);
            void this.cleanup();
        });
    }
    getBackupDir() {
        if (path.isAbsolute(this.manager.config.backupPath)) {
            return this.manager.config.backupPath;
        }
        return path.resolve(path.join(this.paths.cwd(), this.manager.config.backupPath));
    }
    getBackups() {
        return __awaiter(this, void 0, void 0, function* () {
            const backups = this.getBackupDir();
            const files = yield fs.promises.readdir(backups);
            const foundBackups = [];
            for (const file of files) {
                const fullPath = path.join(backups, file);
                const stats = yield fs.promises.stat(fullPath);
                if (file.startsWith('mpmissions_') && stats.isDirectory()) {
                    foundBackups.push({
                        file,
                        mtime: stats.mtime.getTime(),
                    });
                }
            }
            return foundBackups;
        });
    }
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date().valueOf();
            const backups = yield this.getBackups();
            for (const backup of backups) {
                if ((now - backup.mtime) > (this.manager.config.backupMaxAge * 24 * 60 * 60 * 1000)) {
                    yield this.paths.removeLink(backup.file);
                }
            }
        });
    }
}
exports.Backups = Backups;
//# sourceMappingURL=backups.js.map