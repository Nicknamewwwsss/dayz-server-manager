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
exports.Requirements = void 0;
const logger_1 = require("../util/logger");
const processes_1 = require("../util/processes");
const fs = require("fs");
const path = require("path");
const netsh_1 = require("../util/netsh");
class Requirements {
    constructor(manager) {
        this.manager = manager;
        this.VCREDIST_LINK = 'https://www.microsoft.com/en-us/download/details.aspx?id=52685';
        this.VCREDIST_MARKER_DLL = 'VCRuntime140.dll';
        this.DX11_LINK = 'https://www.microsoft.com/en-us/download/confirmation.aspx?id=35';
        this.DX11_MARKER_DLL = 'XAPOFX1_5.dll';
        this.POSSIBLE_PATHS = ['C:/Windows/System32', 'C:/Windows/SysWOW64'];
        this.REG_WIN_ERRORS = 'Windows Registry Editor Version 5.00\n'
            + '\n'
            + '[HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Windows Error Reporting]\n'
            + '"DontShowUI"=dword:00000001';
        this.log = new logger_1.Logger('Requirements');
        this.netSh = new netsh_1.NetSH();
        this.processes = new processes_1.Processes();
    }
    checkFirewall() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.log(logger_1.LogLevel.DEBUG, 'Checking Firewall');
            const exePath = path.resolve(this.manager.getServerExePath());
            const firewallRules = yield this.netSh.getRulesByPath(exePath);
            if (firewallRules === null || firewallRules === void 0 ? void 0 : firewallRules.length) {
                this.log.log(logger_1.LogLevel.DEBUG, 'Firewall is OK!');
                return true;
            }
            this.log.log(logger_1.LogLevel.IMPORTANT, '\n\nFirewall rules were not found.\n'
                + 'You can add the rules manually or by running the following command in a elevated command promt:\n\n'
                + `netsh firewall add allowedprogram ${exePath} DayZ ENABLE\n\n`);
            return false;
        });
    }
    checkDirectX() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.log(logger_1.LogLevel.DEBUG, 'Checking DirectX');
            const dx11Exists = this.POSSIBLE_PATHS.map((searchPath) => {
                return fs.existsSync(path.resolve(path.join(searchPath, this.DX11_MARKER_DLL)));
            }).some((x) => x);
            if (dx11Exists) {
                this.log.log(logger_1.LogLevel.DEBUG, 'DirectX is OK!');
                return true;
            }
            this.log.log(logger_1.LogLevel.IMPORTANT, '\n\nDirectX was not found.\n'
                + 'You can install it from:\n\n'
                + `${this.DX11_LINK}\n\n`
                + `Install it and restart the manager`);
            return false;
        });
    }
    checkVcRedist() {
        return __awaiter(this, void 0, void 0, function* () {
            const vcRedistExists = this.POSSIBLE_PATHS.map((searchPath) => {
                return fs.existsSync(path.resolve(path.join(searchPath, this.VCREDIST_MARKER_DLL)));
            }).some((x) => x);
            if (vcRedistExists) {
                this.log.log(logger_1.LogLevel.DEBUG, 'Visual C++ Redistributable is OK!');
                return true;
            }
            this.log.log(logger_1.LogLevel.IMPORTANT, '\n\nVisual C++ Redistributable was not found.\n'
                + 'You can install it from:\n\n'
                + `${this.VCREDIST_LINK}\n\n`
                + `Install it and restart the manager`);
            return false;
        });
    }
    checkWinErrorReporting() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const winErrorReportingOut = yield this.processes.spawnForOutput('REG', [
                'QUERY',
                'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Windows Error Reporting',
                '/v',
                'DontShowUI',
            ], {
                dontThrow: true,
            });
            if ((winErrorReportingOut === null || winErrorReportingOut === void 0 ? void 0 : winErrorReportingOut.status) !== 0
                || !winErrorReportingOut.stdout
                || !((_a = winErrorReportingOut.stdout) === null || _a === void 0 ? void 0 : _a.includes('0x1'))) {
                this.log.log(logger_1.LogLevel.IMPORTANT, '\n\nWindows Error Reporting Settings are not setup to avoid the server from getting stuck.\n'
                    + 'You change this by executing the fix_win_err_report.reg located in the server manager config directory.\n\n');
                fs.writeFileSync('fix_win_err_report.reg', this.REG_WIN_ERRORS);
                return false;
            }
            this.log.log(logger_1.LogLevel.DEBUG, 'Windows Error Reporting Settings are OK!');
            return true;
        });
    }
}
exports.Requirements = Requirements;
//# sourceMappingURL=requirements.js.map