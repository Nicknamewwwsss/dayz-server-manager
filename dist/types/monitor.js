"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemReport = exports.UsageItem = exports.ServerState = void 0;
// eslint-disable-next-line no-shadow
var ServerState;
(function (ServerState) {
    ServerState["STOPPED"] = "STOPPED";
    ServerState["STOPPING"] = "STOPPING";
    ServerState["STARTED"] = "STARTED";
    ServerState["STARTING"] = "STARTING";
})(ServerState = exports.ServerState || (exports.ServerState = {}));
class UsageItem {
    constructor() {
        this.cpuTotal = -1;
        this.cpuSpent = -1;
        this.uptime = -1;
        this.cpuEach = [];
        this.mem = -1;
        this.memTotal = -1;
    }
}
exports.UsageItem = UsageItem;
class SystemReport {
    constructor() {
        this.system = new UsageItem();
        this.serverState = ServerState.STOPPED;
        this.manager = new UsageItem();
    }
    format() {
        var _a, _b, _c;
        const report = [
            'System Usage:',
            `CPU: ${this.system.cpuTotal}% (${(_a = this.system.cpuEach) === null || _a === void 0 ? void 0 : _a.map((x) => `${x}%`).join(' ')})`,
            `RAM: ${this.system.mem} MB / ${this.system.memTotal} MB`,
            'Manager:',
            `CPU: ${this.manager.cpuTotal}%`,
            `RAM: ${this.manager.mem} MB`,
            `Server state: ${this.serverState}`,
        ];
        if (this.serverState === ServerState.STARTED) {
            report.push('Server Usage:', `CPU: ${(_b = this.server) === null || _b === void 0 ? void 0 : _b.cpuTotal}% (Avg since start)`, `RAM: ${(_c = this.server) === null || _c === void 0 ? void 0 : _c.mem} MB`);
        }
        return report.join('\n');
    }
}
exports.SystemReport = SystemReport;
//# sourceMappingURL=monitor.js.map