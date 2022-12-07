"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeTable = void 0;
const makeTable = (data) => {
    var _a, _b;
    const cols = [];
    for (let i = 0; i < data[0].length; i++) {
        cols.push(0);
    }
    for (const line of data) {
        for (let i = 0; i < data[0].length; i++) {
            cols[i] = Math.max(cols[i], (_b = (_a = line[i]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0);
        }
    }
    return data.map((x) => {
        return x.map((y, i) => {
            // in discord each char is roughly 2 spaces
            return y.padEnd(y.length + ((cols[i] - y.length) * 2));
        }).join('  ');
    });
};
exports.makeTable = makeTable;
//# sourceMappingURL=table.js.map