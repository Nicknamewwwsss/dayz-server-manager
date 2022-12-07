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
exports.Paths = void 0;
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const child_process_1 = require("child_process");
const logger_1 = require("./logger");
class Paths {
    constructor() {
        this.log = new logger_1.Logger('Paths');
    }
    cwd() {
        return process.cwd();
    }
    samePath(p1, p2) {
        if (!p1 || !p2)
            return false;
        const p1Norm = p1
            .replace(/\\/g, '/')
            .toLowerCase()
            .split('/');
        const p2Norm = p2
            .replace(/\\/g, '/')
            .toLowerCase()
            .split('/');
        return ((p1Norm.length === p2Norm.length)
            && p1Norm.every((val, i) => val === p2Norm[i]));
    }
    findFilesInDir(dir, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = [];
            if (!fs.existsSync(dir)) {
                return results;
            }
            const files = yield fse.readdir(dir);
            for (const file of files) {
                const filename = path.join(dir, file);
                const stat = yield fse.lstat(filename);
                if (stat.isDirectory()) {
                    results.push(...(yield this.findFilesInDir(filename, filter)));
                }
                else if (!filter || filter.test(filename)) {
                    results.push(filename);
                }
            }
            return results;
        });
    }
    // https://github.com/vercel/pkg/issues/420
    copyFromPkg(src, dest) {
        const stat = fs.lstatSync(src);
        if (stat.isDirectory()) {
            const files = fs.readdirSync(src);
            for (const file of files) {
                const fullPath = path.join(src, file);
                const fullDest = path.join(dest, file);
                this.copyFromPkg(fullPath, fullDest);
            }
        }
        else {
            fse.ensureDirSync(path.dirname(dest));
            const buff = fs.readFileSync(src);
            fs.writeFileSync(dest, buff);
        }
    }
    removeLink(target) {
        // cmd //c rmdir "$__TARGET_DIR"
        return (child_process_1.spawnSync('cmd', [
            '/c',
            'rmdir',
            '/S',
            '/Q',
            target,
        ]).status === 0);
    }
    linkDirsFromTo(source, target) {
        // cmd //c mklink //j "$__TARGET_DIR" "$__SOURCE_DIR"
        try {
            if (fs.existsSync(target)) {
                if (!this.removeLink(target)) {
                    this.log.log(logger_1.LogLevel.ERROR, 'Could not remove link before creating new one');
                    return false;
                }
            }
            return (child_process_1.spawnSync('cmd', [
                '/c',
                'mklink',
                '/j',
                target,
                source,
            ]).status === 0);
        }
        catch (e) {
            this.log.log(logger_1.LogLevel.ERROR, `Error linking ${source} to ${target}`, e);
            return false;
        }
    }
    copyDirFromTo(source, target) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (fs.existsSync(target)) {
                    if (!this.removeLink(target)) {
                        this.log.log(logger_1.LogLevel.ERROR, 'Could not remove dir before creating new one');
                        return false;
                    }
                }
                yield fse.ensureDir(target);
                yield fse.copy(source, target);
                return true;
            }
            catch (e) {
                this.log.log(logger_1.LogLevel.ERROR, `Error copying ${source} to ${target}`, e);
                return false;
            }
        });
    }
}
exports.Paths = Paths;
//# sourceMappingURL=paths.js.map