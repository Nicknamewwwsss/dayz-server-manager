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
exports.NetSH = void 0;
const logger_1 = require("./logger");
const paths_1 = require("./paths");
const processes_1 = require("./processes");
class NetSH {
    constructor() {
        this.log = new logger_1.Logger('NetSH');
        this.processes = new processes_1.Processes();
        this.paths = new paths_1.Paths();
    }
    addRule(path) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.processes.spawnForOutput('netsh', [
                'firewall',
                'add',
                'allowedprogram',
                path,
                'DayZ',
                'ENABLE',
            ]);
        });
    }
    getAllRules() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.processes.spawnForOutput('netsh', [
                    'advfirewall',
                    'firewall',
                    'show',
                    'rule',
                    'name=all',
                    'verbose',
                ]);
                return result.stdout
                    .replace(/\r\n/gm, '\n')
                    .split(/\n\n/gm)
                    .filter((x) => x.length > 1)
                    .map((entry) => {
                    const rule = {};
                    entry.split('\n')
                        .filter((x) => !!x && !(/^[-]+$/g).test(x))
                        .map((x) => {
                        const splitPoint = x.indexOf(':');
                        const parts = [
                            x.slice(0, splitPoint).trim(),
                            x.slice(splitPoint + 1).trim(),
                        ];
                        return parts;
                    })
                        // eslint-disable-next-line prefer-destructuring
                        .forEach((x) => rule[x[0]] = x[1]);
                    return rule;
                });
            }
            catch (e) {
                this.log.log(logger_1.LogLevel.ERROR, 'Fetching firewall rules failed', e);
                return [];
            }
        });
    }
    getRulesByPath(path) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.getAllRules();
                return result.filter((rule) => {
                    for (const key of Object.keys(rule)) {
                        if (!!rule[key]
                            && this.paths.samePath(path, rule[key]))
                            return true;
                    }
                    return false;
                });
            }
            catch (e) {
                this.log.log(logger_1.LogLevel.ERROR, 'Fetching firewall rules failed', e);
                return [];
            }
        });
    }
}
exports.NetSH = NetSH;
//# sourceMappingURL=netsh.js.map