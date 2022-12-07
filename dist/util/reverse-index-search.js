"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reverseIndexSearch = void 0;
const reverseIndexSearch = (list, cond) => {
    for (let i = list.length - 1; i >= 0; --i) {
        if (cond(list[i], i, list)) {
            return i;
        }
    }
    return -1;
};
exports.reverseIndexSearch = reverseIndexSearch;
//# sourceMappingURL=reverse-index-search.js.map