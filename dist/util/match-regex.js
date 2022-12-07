"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchRegex = void 0;
const matchRegex = (regex, data) => {
    const matches = [];
    let match = null;
    // eslint-disable-next-line no-cond-assign
    while (match = regex.exec(data)) {
        matches.push(match);
    }
    return matches;
};
exports.matchRegex = matchRegex;
//# sourceMappingURL=match-regex.js.map