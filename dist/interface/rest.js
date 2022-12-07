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
exports.REST = void 0;
const express = require("express");
const basicAuth = require("express-basic-auth");
const compression = require("compression");
// import * as cors from 'cors';
const path = require("path");
const logger_1 = require("../middleware/logger");
const interface_1 = require("../types/interface");
const logger_2 = require("../util/logger");
class REST {
    constructor(manager) {
        this.manager = manager;
        this.log = new logger_2.Logger('REST');
        this.path = '/';
        this.router = express.Router();
        this.UI_FILES = path.join(__dirname, '../ui');
    }
    // for easier tests
    createExpress() {
        return express();
    }
    start() {
        this.express = this.createExpress();
        this.port = this.manager.getWebPort();
        this.host = this.manager.config.publishWebServer ? '0.0.0.0' : '127.0.0.1';
        // middlewares
        this.express.use(compression());
        this.express.use(express.json({ limit: '50mb' }));
        this.express.use(express.urlencoded({ extended: true }));
        this.express.use(logger_1.loggerMiddleware);
        // static content
        this.express.use(express.static(this.UI_FILES));
        this.setupExpress();
        // controllers
        this.express.get('/version', (req, res) => res.send(this.manager.APP_VERSION));
        this.express.use('/api', this.router);
        this.setupRouter();
        return new Promise((r) => {
            this.server = this.express.listen(this.port, this.host, () => {
                this.log.log(logger_2.LogLevel.IMPORTANT, `App listening on the http://${this.host}:${this.port}`);
                r();
            });
        });
    }
    setupExpress() {
        // cors
        this.express.all('*', (req, res, next) => this.handleCors(req, res, next));
        this.express.get('/login', (req, res) => this.handleUiFileRequest(req, res));
        this.express.get('/dashboard/*', (req, res) => this.handleUiFileRequest(req, res));
        this.express.get('/dashboard', (req, res) => this.handleUiFileRequest(req, res));
    }
    handleCors(req, res, next) {
        var _a, _b, _c;
        const origin = (_b = (_a = req.header('Origin')) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : '';
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        if (((_c = req.method) === null || _c === void 0 ? void 0 : _c.toLowerCase()) === 'options') {
            res.sendStatus(204);
            return;
        }
        next();
    }
    handleUiFileRequest(req, res) {
        res.sendFile(path.join(this.UI_FILES, 'index.html'));
    }
    setupRouter() {
        var _a, _b;
        const users = {};
        for (const user of ((_b = (_a = this.manager.config) === null || _a === void 0 ? void 0 : _a.admins) !== null && _b !== void 0 ? _b : [])) {
            users[user.userId] = user.password;
        }
        this.router.use(basicAuth({ users, challenge: false }));
        for (const [resource, command] of this.manager.interface.commandMap) {
            if (command.disableRest)
                continue;
            this.log.log(logger_2.LogLevel.DEBUG, `Registering ${command.method} ${resource}`);
            this.router[command.method](`/${resource}`, (req, res) => {
                void this.handleCommand(req, res, resource);
            });
        }
    }
    handleCommand(req, res, resource) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.manager.initDone) {
                res.sendStatus(503);
                return;
            }
            const base64Credentials = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
            const username = base64Credentials
                ? (_c = (_b = Buffer.from(base64Credentials, 'base64')) === null || _b === void 0 ? void 0 : _b.toString('ascii')) === null || _c === void 0 ? void 0 : _c.split(':')[0]
                : '';
            const internalRequest = new interface_1.Request();
            internalRequest.accept = (_d = req.headers.accept) !== null && _d !== void 0 ? _d : 'application/json';
            internalRequest.body = req.body;
            internalRequest.query = req.query;
            internalRequest.resource = resource;
            internalRequest.user = username;
            const internalResponse = yield this.manager.interface.execute(internalRequest);
            res.status(internalResponse.status).send(internalResponse.body);
        });
    }
    stop() {
        return new Promise((r, e) => {
            var _a;
            if (!this.server || !this.server.listening) {
                r();
            }
            (_a = this.server) === null || _a === void 0 ? void 0 : _a.close((error) => {
                if (error) {
                    e(error);
                }
                else {
                    r();
                }
            });
        });
    }
}
exports.REST = REST;
//# sourceMappingURL=rest.js.map