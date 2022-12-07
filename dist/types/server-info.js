"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSameServerInfo = void 0;
const isSameServerInfo = (x1, x2) => {
    if (!x1 && !x2) {
        return true;
    }
    if (!x1 || !x2) {
        return false;
    }
    return [
        'name',
        'port',
        'worldName',
        'password',
        'battleye',
        'maxPlayers',
    ].every((x) => x1[x] === x2[x]);
};
exports.isSameServerInfo = isSameServerInfo;
//# sourceMappingURL=server-info.js.map