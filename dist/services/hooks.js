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
exports.Hooks = void 0;
const logger_1 = require("../util/logger");
const processes_1 = require("../util/processes");
class Hooks {
    constructor(manager) {
        this.manager = manager;
        this.log = new logger_1.Logger('Hooks');
        this.processes = new processes_1.Processes();
    }
    getHooks(type) {
        var _a;
        return ((_a = this.manager.config.hooks) !== null && _a !== void 0 ? _a : []).filter((x) => x.type === type);
    }
    executeHooks(hookType) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const hooks = this.getHooks(hookType);
            if (hooks.length) {
                for (const hook of hooks) {
                    this.log.log(logger_1.LogLevel.DEBUG, `Executing beforeStart Hook (${hook.program} ${((_a = hook.params) !== null && _a !== void 0 ? _a : []).join(' ')})`);
                    const hookOut = yield this.processes.spawnForOutput(hook.program, (_b = hook.params) !== null && _b !== void 0 ? _b : [], {
                        dontThrow: true,
                    });
                    if ((hookOut === null || hookOut === void 0 ? void 0 : hookOut.status) === 0) {
                        this.log.log(logger_1.LogLevel.INFO, `beforeStart Hook (${hook.program} ${((_c = hook.params) !== null && _c !== void 0 ? _c : []).join(' ')}) succeed`);
                    }
                    else {
                        const msg = `beforeStart Hook (${hook.program} ${((_d = hook.params) !== null && _d !== void 0 ? _d : []).join(' ')}) failed`;
                        this.log.log(logger_1.LogLevel.ERROR, msg, hookOut);
                        void ((_e = this.manager.discord) === null || _e === void 0 ? void 0 : _e.relayRconMessage(msg));
                    }
                }
            }
        });
    }
}
exports.Hooks = Hooks;
//# sourceMappingURL=hooks.js.map