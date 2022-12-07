"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractZip = exports.download = void 0;
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const http = require("http");
const https = require("https");
const extract = require("extract-zip");
const download = (url, target) => {
    return new Promise((res, rej) => {
        try {
            const dirname = path.dirname(target);
            fse.ensureDirSync(dirname);
            const file = fs.createWriteStream(target);
            (url.startsWith('https') ? https : http).get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    res();
                });
            });
        }
        catch (e) {
            rej(e);
        }
    });
};
exports.download = download;
const extractZip = (zip, opts) => {
    return extract(zip, opts);
};
exports.extractZip = extractZip;
//# sourceMappingURL=download.js.map