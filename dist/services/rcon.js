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
exports.RCON = exports.BattleyeConf = void 0;
const battleye_1 = require("@senfo/battleye");
const dgram = require("dgram");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const logger_1 = require("../util/logger");
const monitor_1 = require("../types/monitor");
const match_regex_1 = require("../util/match-regex");
class BattleyeConf {
    constructor(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    RConPassword, 
    // eslint-disable-next-line @typescript-eslint/naming-convention
    RestrictRCon) {
        this.RConPassword = RConPassword;
        this.RestrictRCon = RestrictRCon;
    }
}
exports.BattleyeConf = BattleyeConf;
class RCON {
    constructor(manager) {
        this.manager = manager;
        this.RND_RCON_PW = `RCON${Math.floor(Math.random() * 100000)}`;
        this.log = new logger_1.Logger('RCON');
        this.connected = false;
        this.connectionErrorCounter = 0;
        this.duplicateMessageCache = [];
        this.duplicateMessageCacheSize = 3;
    }
    isConnected() {
        return this.connected;
    }
    createSocket(port) {
        return new battleye_1.Socket({
            port,
        });
    }
    start(skipServerWait) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            this.connectionErrorCounter = 0;
            if (((_b = (_a = this.manager.config) === null || _a === void 0 ? void 0 : _a.serverCfg) === null || _b === void 0 ? void 0 : _b.BattlEye) === 0) {
                return;
            }
            // get free listening port
            const openListeningPort = yield new Promise((r) => {
                const tempSocket = dgram.createSocket('udp4');
                tempSocket.bind(() => {
                    var _a;
                    const openUdpPort = (_a = tempSocket.address()) === null || _a === void 0 ? void 0 : _a.port;
                    tempSocket.close();
                    r(openUdpPort);
                });
            });
            if (!openListeningPort) {
                throw new Error('Could not find open UDP Port for Listener');
            }
            // create socket
            this.socket = this.createSocket(openListeningPort);
            this.socket.on('listening', (socket) => {
                const addr = socket.address();
                this.log.log(logger_1.LogLevel.IMPORTANT, `Listening on ${typeof addr === 'string' ? addr : `${addr.address}:${addr.port}`}`);
            });
            this.socket.on('received', (resolved, packet /* , buffer, connection, info */) => {
                this.log.log(logger_1.LogLevel.DEBUG, `received`, packet);
            });
            this.socket.on('sent', (packet /* , buffer, bytes, connection */) => {
                this.log.log(logger_1.LogLevel.DEBUG, `sent`, packet);
            });
            this.socket.on('error', (err) => {
                this.log.log(logger_1.LogLevel.ERROR, `socket error`, err === null || err === void 0 ? void 0 : err.message);
            });
            if (skipServerWait) {
                this.setupConnection();
            }
            else {
                this.manager.monitor.registerStateListener('rconInit', (state) => {
                    if (this.connection || state !== monitor_1.ServerState.STARTED)
                        return;
                    this.manager.monitor.removeStateListener('rconInit');
                    this.setupConnection();
                });
            }
        });
    }
    setupConnection() {
        // create connection
        this.connection = this.socket.connection({
            name: 'rcon',
            password: this.getRconPassword(),
            ip: '127.0.0.1',
            port: this.getRconPort(),
        }, {
            reconnect: true,
            reconnectTimeout: 500,
            keepAlive: true,
            keepAliveInterval: 10000,
            timeout: true,
            timeoutInterval: 1000,
            serverTimeout: 30000,
            packetTimeout: 1000,
            packetTimeoutThresholded: 5, // packets to resend
        });
        this.connection.on('message', (message /* , packet */) => {
            var _a;
            if (this.duplicateMessageCache.includes(message)) {
                this.log.log(logger_1.LogLevel.DEBUG, `duplicate message`, message);
                return;
            }
            this.duplicateMessageCache.push(message);
            if (this.duplicateMessageCache.length > this.duplicateMessageCacheSize) {
                this.duplicateMessageCache.shift();
            }
            this.log.log(logger_1.LogLevel.DEBUG, `message`, message);
            void ((_a = this.manager.discord) === null || _a === void 0 ? void 0 : _a.relayRconMessage(message));
        });
        this.connection.on('command', (data, resolved, packet) => {
            this.log.log(logger_1.LogLevel.DEBUG, `command packet`, packet);
        });
        this.connection.on('disconnected', (reason) => {
            var _a;
            if (reason instanceof Error && ((_a = reason === null || reason === void 0 ? void 0 : reason.message) === null || _a === void 0 ? void 0 : _a.includes('Server connection timed out'))) {
                this.log.log(logger_1.LogLevel.ERROR, `disconnected`, reason.message);
            }
            else {
                this.log.log(logger_1.LogLevel.ERROR, `disconnected`, reason);
            }
            this.connected = false;
            this.duplicateMessageCache = [];
        });
        this.connection.on('debug', (data) => {
            this.log.log(logger_1.LogLevel.DEBUG, 'debug', data);
        });
        this.connection.on('error', (err) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (err instanceof Error && ((_a = err === null || err === void 0 ? void 0 : err.message) === null || _a === void 0 ? void 0 : _a.includes('Server connection timed out'))) {
                this.log.log(logger_1.LogLevel.ERROR, `connection error`, err.message);
                // restart on connection errors (disabled for now)
                // this.connectionErrorCounter++;
                // if (this.connectionErrorCounter >= 5) {
                //     await this.stop();
                //     void this.start(true);
                // }
            }
            else {
                this.log.log(logger_1.LogLevel.ERROR, `connection error`, err);
            }
        }));
        this.connection.on('connected', () => {
            if (!this.connected) {
                this.connected = true;
                this.log.log(logger_1.LogLevel.IMPORTANT, 'connected');
                void this.sendCommand('say -1 Big Brother Connected.');
            }
        });
    }
    getRconPassword() {
        var _a, _b;
        return (((_a = this.manager.config) === null || _a === void 0 ? void 0 : _a.rconPassword)
            ? (_b = this.manager.config) === null || _b === void 0 ? void 0 : _b.rconPassword
            : this.RND_RCON_PW);
    }
    getRconPort() {
        var _a, _b;
        return (((_a = this.manager.config) === null || _a === void 0 ? void 0 : _a.rconPort)
            ? (_b = this.manager.config) === null || _b === void 0 ? void 0 : _b.rconPort
            : 2306);
    }
    createBattleyeConf() {
        var _a, _b;
        let battleyePath = (_a = this.manager.config) === null || _a === void 0 ? void 0 : _a.battleyePath;
        if (!battleyePath) {
            battleyePath = 'battleye';
        }
        let baseDir = this.manager.getServerPath();
        const profiles = (_b = this.manager.config) === null || _b === void 0 ? void 0 : _b.profilesPath;
        if (profiles) {
            if (path.isAbsolute(profiles)) {
                baseDir = profiles;
            }
            else {
                baseDir = path.join(baseDir, profiles);
            }
        }
        battleyePath = path.join(baseDir, battleyePath);
        const battleyeConfPath = path.join(battleyePath, 'BEServer_x64.cfg');
        const rConPassword = this.getRconPassword();
        const rConPort = this.getRconPort();
        fse.ensureDirSync(battleyePath);
        try {
            fs.readdirSync(battleyePath).forEach((x) => {
                const lower = x.toLowerCase();
                if (lower.includes('beserver') && lower.endsWith('.cfg')) {
                    fs.unlinkSync(path.join(battleyePath, x));
                }
            });
        }
        catch (_c) { }
        fs.writeFileSync(battleyeConfPath, `RConPassword ${rConPassword}\nRestrictRCon 0\nRConPort ${rConPort}`);
    }
    sendCommand(command) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connection || !this.connected) {
                return null;
            }
            let response = null;
            try {
                response = yield this.connection.command(command);
                this.log.log(logger_1.LogLevel.DEBUG, `response to ${response.command}:\n${response.data}`);
            }
            catch (e) {
                if (typeof e === 'object' && ((_a = e === null || e === void 0 ? void 0 : e.message) === null || _a === void 0 ? void 0 : _a.includes('Server connection timed out'))) {
                    this.log.log(logger_1.LogLevel.ERROR, 'Error while executing RCON command: Server connection timed out');
                }
                else {
                    this.log.log(logger_1.LogLevel.ERROR, 'Error while executing RCON command', e);
                }
            }
            return (_b = response === null || response === void 0 ? void 0 : response.data) !== null && _b !== void 0 ? _b : null;
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connection) {
                this.connection.removeAllListeners();
                if (this.connection.connected) {
                    this.connection.once('error', () => { });
                    this.connection.kill(new Error('Reload'));
                    this.connection = undefined;
                    this.connected = false;
                }
            }
            if (this.socket) {
                return new Promise((res, rej) => {
                    var _a;
                    try {
                        this.socket.removeAllListeners();
                        ((_a = this.socket['socket']) !== null && _a !== void 0 ? _a : {
                            close: (c) => c(),
                        }).close(() => {
                            this.socket = undefined;
                            res();
                        });
                    }
                    catch (e) {
                        rej(e);
                    }
                });
            }
        });
    }
    getBansRaw() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendCommand('bans');
        });
    }
    getBans() {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getBansRaw();
            if (!data) {
                return [];
            }
            const guidBans = (_b = (_a = match_regex_1.matchRegex(/(\d+)\s+([0-9a-fA-F]+)\s([perm|\d]+)\s+([\S ]+)$/gim, data)) === null || _a === void 0 ? void 0 : _a.map((e) => e.slice(1, e.length - 1))) !== null && _b !== void 0 ? _b : [];
            const ipBans = (_d = (_c = match_regex_1.matchRegex(/(\d+)\s+([0-9\.]+)\s+([perm|\d]+)\s+([\S ]+)$/gim, data)) === null || _c === void 0 ? void 0 : _c.map((e) => e.slice(1, e.length - 1))) !== null && _d !== void 0 ? _d : [];
            return [
                ...guidBans
                    .map((e) => ({
                    type: 'guid',
                    id: e[1],
                    ban: e[2],
                    time: e[3],
                    reason: e[4],
                })),
                ...ipBans
                    .map((e) => ({
                    type: 'ip',
                    id: e[1],
                    ban: e[2],
                    time: e[3],
                    reason: e[4],
                })),
            ];
        });
    }
    getPlayersRaw() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendCommand('players');
        });
    }
    getPlayers() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getPlayersRaw();
            if (!data) {
                return [];
            }
            return (_a = match_regex_1.matchRegex(/(\d+)\s+(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+\b)\s+(\d+)\s+([0-9a-fA-F]+)\(\w+\)\s([\S ]+)$/gim, data)
                .map((e) => {
                var _a, _b;
                return {
                    id: e[1],
                    ip: e[2],
                    port: e[3],
                    ping: e[4],
                    beguid: e[5],
                    name: (_a = e[6]) === null || _a === void 0 ? void 0 : _a.replace(' (Lobby)', ''),
                    lobby: !!((_b = e[6]) === null || _b === void 0 ? void 0 : _b.includes(' (Lobby)')),
                };
            })) !== null && _a !== void 0 ? _a : [];
        });
    }
    kick(player) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendCommand(`kick ${player}`);
        });
    }
    kickAll() {
        return __awaiter(this, void 0, void 0, function* () {
            // await this.sendCommand(`kick -1`);
            const players = yield this.getPlayers();
            if (players === null || players === void 0 ? void 0 : players.length) {
                yield Promise.all(players.map((player) => this.kick(player.id)));
            }
        });
    }
    ban(player) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendCommand(`ban ${player}`);
        });
    }
    removeBan(player) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendCommand(`removeban ${player}`);
        });
    }
    reloadBans() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendCommand('reloadbans');
        });
    }
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendCommand('#shutdown');
        });
    }
    global(message) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendCommand(`say -1 ${message}`);
        });
    }
    lock() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendCommand('#lock');
        });
    }
    unlock() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendCommand('#unlock');
        });
    }
}
exports.RCON = RCON;
//# sourceMappingURL=rcon.js.map