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
exports.Processes = exports.SystemInfo = exports.ProcessEntry = void 0;
const child_process_1 = require("child_process");
const os = require("os");
const logger_1 = require("./logger");
const merge_1 = require("./merge");
class ProcessEntry {
    constructor() {
        /* eslint-disable @typescript-eslint/naming-convention */
        this.Name = '';
        this.ProcessId = '';
        this.ExecutablePath = '';
        this.CommandLine = '';
        this.PrivatePageCount = '';
        this.CreationDate = '';
        this.UserModeTime = '';
        this.KernelModeTime = '';
        /* eslint-enable @typescript-eslint/naming-convention */
    }
}
exports.ProcessEntry = ProcessEntry;
class SystemInfo {
    constructor() {
        this.cpu = [];
        this.avgLoad = [];
        this.memTotal = -1;
        this.memFree = -1;
        this.uptime = -1;
    }
}
exports.SystemInfo = SystemInfo;
class Processes {
    constructor() {
        this.log = new logger_1.Logger('Processes');
    }
    getProcessList(where) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.spawnForOutput('cmd', [
                '/c',
                [
                    'wmic',
                    'process',
                    'get',
                    ...(where ? ['where', `${where}`] : []),
                    `${Processes.WMIC_VALUES.join(',')}`,
                    '/VALUE',
                ].join(' '),
            ], {
                dontThrow: true,
            });
            const procs = [];
            if (result.stdout) {
                procs.push(...result.stdout
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
                    .map((x) => {
                    let proc = new ProcessEntry();
                    x.forEach((y) => proc = merge_1.merge(proc, { [y[0]]: y[1] }));
                    return proc;
                }));
            }
            return procs;
        });
    }
    getProcessCPUSpent(proc) {
        return (Number(proc.UserModeTime) / 10000)
            + (Number(proc.KernelModeTime) / 10000);
    }
    getProcessUptime(proc) {
        const start = new Date(proc.CreationDate).valueOf();
        const now = new Date().valueOf();
        return (now - start);
    }
    getProcessCPUUsage(proc, prev) {
        let curSpent = this.getProcessCPUSpent(proc);
        let curUp = this.getProcessUptime(proc);
        if (prev) {
            curSpent -= this.getProcessCPUSpent(proc);
            curUp -= this.getProcessUptime(proc);
        }
        return Math.round(((curSpent / Math.max(curUp, 1)) * 100) / Math.max(os.cpus().length, 1));
    }
    killProcess(pid, force) {
        return this.spawnForOutput('taskkill', [
            ...(force ? ['/F'] : []),
            '/PID',
            pid,
        ]);
    }
    getSystemUsage() {
        return merge_1.merge(new SystemInfo(), {
            cpu: os.cpus(),
            avgLoad: os.loadavg(),
            memTotal: os.totalmem(),
            memFree: os.freemem(),
            uptime: os.uptime(),
        });
    }
    spawnForOutput(cmd, args, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((r, e) => {
                var _a, _b;
                const startTS = new Date().valueOf();
                try {
                    const spawnedProcess = child_process_1.spawn(cmd, args, opts === null || opts === void 0 ? void 0 : opts.spawnOpts);
                    let stdout = '';
                    if (spawnedProcess.stdout) {
                        spawnedProcess.stdout.on('data', (data) => {
                            if (opts === null || opts === void 0 ? void 0 : opts.verbose) {
                                this.log.log(logger_1.LogLevel.DEBUG, `SPAWN OUT: ${data}`);
                            }
                            if (opts === null || opts === void 0 ? void 0 : opts.stdOutHandler) {
                                opts === null || opts === void 0 ? void 0 : opts.stdOutHandler(data);
                            }
                            stdout += data;
                        });
                    }
                    let stderr = '';
                    if (spawnedProcess.stderr) {
                        spawnedProcess.stderr.on('data', (data) => {
                            if (opts === null || opts === void 0 ? void 0 : opts.verbose) {
                                this.log.log(logger_1.LogLevel.ERROR, `SPAWN ERR: ${data}`);
                            }
                            if (opts === null || opts === void 0 ? void 0 : opts.stdErrHandler) {
                                opts === null || opts === void 0 ? void 0 : opts.stdErrHandler(data);
                            }
                            stderr += data;
                        });
                    }
                    spawnedProcess.on('error', (error) => {
                        var _a;
                        this.log.log(logger_1.LogLevel.ERROR, (_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : 'Spawned processes threw an error', error);
                    });
                    spawnedProcess.on('close', (code) => {
                        var _a;
                        if (!spawnedProcess.stdout || !spawnedProcess.stderr) {
                            console.log('\n');
                        }
                        if (opts === null || opts === void 0 ? void 0 : opts.verbose) {
                            this.log.log(logger_1.LogLevel.DEBUG, `Spawned process exited with code ${code}`);
                            this.log.log(logger_1.LogLevel.DEBUG, `Duration: ${new Date().valueOf() - startTS}`);
                        }
                        if (!code || ((_a = opts === null || opts === void 0 ? void 0 : opts.ignoreCodes) === null || _a === void 0 ? void 0 : _a.includes(code)) || (opts === null || opts === void 0 ? void 0 : opts.dontThrow)) {
                            r({ status: code !== null && code !== void 0 ? code : 0, stdout, stderr });
                        }
                        else {
                            // eslint-disable-next-line prefer-promise-reject-errors
                            e({
                                status: code,
                                stdout,
                                stderr,
                            });
                        }
                    });
                }
                catch (error) {
                    if (opts === null || opts === void 0 ? void 0 : opts.dontThrow) {
                        r({ status: 1, stdout: '', stderr: (_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : '' });
                    }
                    else {
                        // eslint-disable-next-line prefer-promise-reject-errors
                        e({ status: 1, stdout: '', stderr: (_b = error === null || error === void 0 ? void 0 : error.message) !== null && _b !== void 0 ? _b : '' });
                    }
                }
            });
        });
    }
}
exports.Processes = Processes;
Processes.WMIC_VALUES = Object.keys(new ProcessEntry());
//# sourceMappingURL=processes.js.map