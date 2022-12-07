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
exports.DiscordBot = void 0;
const discord_js_1 = require("discord.js");
const discord_message_handler_1 = require("../interface/discord-message-handler");
const logger_1 = require("../util/logger");
class DiscordBot {
    constructor(manager) {
        this.manager = manager;
        this.log = new logger_1.Logger('Discord');
        this.debug = false;
        this.messageHandler = new discord_message_handler_1.DiscordMessageHandler(manager, this);
    }
    start() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.manager.config.discordBotToken) {
                this.log.log(logger_1.LogLevel.WARN, 'Not starting discord bot, because no bot token was provided');
                return;
            }
            this.client = new discord_js_1.Client();
            this.client.on('ready', () => this.onReady());
            if (this.debug) {
                this.client.on('invalidated', () => this.log.log(logger_1.LogLevel.ERROR, 'invalidated'));
                this.client.on('debug', (m) => this.log.log(logger_1.LogLevel.DEBUG, m));
                this.client.on('warn', (m) => this.log.log(logger_1.LogLevel.WARN, m));
            }
            this.client.on('message', (m) => this.onMessage(m));
            this.client.on('disconnect', (d) => {
                if (d === null || d === void 0 ? void 0 : d.wasClean) {
                    this.log.log(logger_1.LogLevel.INFO, 'disconnect');
                }
                else {
                    this.log.log(logger_1.LogLevel.ERROR, 'disconnect', d);
                }
            });
            this.client.on('error', (e) => this.log.log(logger_1.LogLevel.ERROR, 'error', e));
            yield this.client.login((_a = this.manager.config) === null || _a === void 0 ? void 0 : _a.discordBotToken);
        });
    }
    onReady() {
        this.log.log(logger_1.LogLevel.IMPORTANT, 'Discord Ready!');
    }
    onMessage(message) {
        var _a;
        if (message.author.bot) {
            return;
        }
        if (this.debug) {
            this.log.log(logger_1.LogLevel.DEBUG, `Detected message: ${message.content}`);
        }
        if ((_a = message.content) === null || _a === void 0 ? void 0 : _a.startsWith(this.messageHandler.PREFIX)) {
            void this.messageHandler.handleCommandMessage(message);
        }
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client) {
                yield this.client.destroy();
                this.client = undefined;
            }
        });
    }
    relayRconMessage(message) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                return;
            }
            const rconChannels = (_a = this.manager.config) === null || _a === void 0 ? void 0 : _a.discordChannels.filter((x) => x.mode === 'rcon');
            const matching = (_f = (_e = (_d = (_c = (_b = this.client) === null || _b === void 0 ? void 0 : _b.guilds) === null || _c === void 0 ? void 0 : _c.first()) === null || _d === void 0 ? void 0 : _d.channels) === null || _e === void 0 ? void 0 : _e.filter((channel) => {
                var _a;
                return (_a = rconChannels === null || rconChannels === void 0 ? void 0 : rconChannels.some((x) => { var _a; return x.channel === ((_a = channel.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()); })) !== null && _a !== void 0 ? _a : false;
            }).array()) !== null && _f !== void 0 ? _f : [];
            for (const x of matching) {
                try {
                    yield x.send(message);
                }
                catch (e) {
                    this.log.log(logger_1.LogLevel.ERROR, `Error relaying message to channel: ${x.name}`, e);
                }
            }
        });
    }
}
exports.DiscordBot = DiscordBot;
//# sourceMappingURL=discord.js.map