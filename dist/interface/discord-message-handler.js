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
exports.DiscordMessageHandler = void 0;
const logger_1 = require("../util/logger");
const interface_1 = require("../types/interface");
class DiscordMessageHandler {
    constructor(manager, discord) {
        this.manager = manager;
        this.discord = discord;
        this.log = new logger_1.Logger('Discord');
        this.PREFIX = '!';
    }
    handleCommandMessage(message) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.manager.initDone)
                return;
            const args = message.content.slice(this.PREFIX.length).trim().split(/ +/);
            const command = (_a = args === null || args === void 0 ? void 0 : args.shift()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
            if (!command)
                return;
            const channelName = message.channel.name;
            const authorId = message.author.tag;
            if (!(authorId === null || authorId === void 0 ? void 0 : authorId.includes('#'))) {
                // safety
                return;
            }
            this.log.log(logger_1.LogLevel.INFO, `Command "${command}" from "${authorId}" in "${channelName}" with args: "${args === null || args === void 0 ? void 0 : args.join(' ')}"`);
            const handler = this.manager.interface.commandMap.get(command);
            if (!handler || handler.disableDiscord) {
                yield message.reply('Command not found.');
                return;
            }
            const configChannel = this.manager.config.discordChannels.find((x) => x.channel.toLowerCase() === (channelName === null || channelName === void 0 ? void 0 : channelName.toLowerCase()));
            if ((configChannel === null || configChannel === void 0 ? void 0 : configChannel.mode) !== 'admin' && !handler.discordPublic) {
                yield message.reply('This command is not allowed in this channel.');
                return;
            }
            const req = new interface_1.Request();
            req.accept = 'text/plain';
            req.resource = command;
            req.user = authorId;
            if ((_b = handler.params) === null || _b === void 0 ? void 0 : _b.length) {
                if (!handler.paramsOptional && handler.params.length !== (args === null || args === void 0 ? void 0 : args.length)) {
                    yield message.reply(`Wrong param count. Usage: ${this.PREFIX}${command} ${handler.params.join(' ')}`);
                    return;
                }
                req.body = {};
                handler.params.forEach((x, i) => {
                    if (i < args.length) {
                        req.body[x] = args[i];
                    }
                });
            }
            const res = yield this.manager.interface.execute(req);
            if (res.status >= 200 && res.status < 300) {
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                yield message.reply(`\n${res.body}`);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                yield message.reply(`\nError: ${res.body}`);
            }
        });
    }
}
exports.DiscordMessageHandler = DiscordMessageHandler;
//# sourceMappingURL=discord-message-handler.js.map