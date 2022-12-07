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
exports.sameDirHash = void 0;
const fs = require("fs");
const folderHash = require("folder-hash");
const sameDirHash = (dir1, dir2) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!fs.existsSync(dir1) || !fs.existsSync(dir2)) {
        return false;
    }
    const hashes = yield Promise.all([
        folderHash.hashElement(dir1, { folders: { ignoreRootName: true } }),
        folderHash.hashElement(dir2, { folders: { ignoreRootName: true } }),
    ]);
    return ((_a = hashes[0]) === null || _a === void 0 ? void 0 : _a.hash) && (((_b = hashes[0]) === null || _b === void 0 ? void 0 : _b.hash) === ((_c = hashes[1]) === null || _c === void 0 ? void 0 : _c.hash));
});
exports.sameDirHash = sameDirHash;
//# sourceMappingURL=compare-folders.js.map