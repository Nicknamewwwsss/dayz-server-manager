"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Response = exports.Request = void 0;
class Request {
    constructor() {
        this.resource = '';
        this.accept = 'application/json';
    }
}
exports.Request = Request;
class Response {
    constructor(status, body) {
        this.status = status;
        this.body = body;
    }
}
exports.Response = Response;
//# sourceMappingURL=interface.js.map