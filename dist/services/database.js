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
exports.Database = exports.DatabaseTypes = exports.Sqlite3Wrapper = void 0;
const sqlite3 = require("better-sqlite3");
const logger_1 = require("../util/logger");
class Sqlite3Wrapper {
    constructor(file, opts) {
        this.db = Sqlite3Wrapper.createDb(file, opts);
    }
    static createDb(file, opts) {
        return new sqlite3(file, opts);
    }
    /**
     * Fire (optionally wait until executed) but no results
     * @param sql the query
     * @param params the params
     */
    run(sql, ...params) {
        const stmt = this.db.prepare(sql);
        return stmt.run(params);
    }
    /**
     * first result only
     * @param sql the query
     * @param params the params
     */
    first(sql, ...params) {
        const stmt = this.db.prepare(sql);
        return stmt.get(params);
    }
    /**
     * all results
     * @param sql the query
     * @param params the params
     */
    all(sql, ...params) {
        const stmt = this.db.prepare(sql);
        return stmt.all(params);
    }
    close() {
        this.db.close();
    }
}
exports.Sqlite3Wrapper = Sqlite3Wrapper;
// eslint-disable-next-line no-shadow
var DatabaseTypes;
(function (DatabaseTypes) {
    DatabaseTypes[DatabaseTypes["METRICS"] = 0] = "METRICS";
})(DatabaseTypes = exports.DatabaseTypes || (exports.DatabaseTypes = {}));
class Database {
    constructor(manager) {
        this.manager = manager;
        this.log = new logger_1.Logger('Database');
        this.databases = new Map();
        this.dbConfigs = new Map([
            [
                DatabaseTypes.METRICS,
                {
                    file: 'metrics.db',
                    opts: {
                        readonly: false,
                    },
                },
            ],
        ]);
        this.log.log(logger_1.LogLevel.INFO, `Database Setup: node ${process.versions.node} : v${process.versions.modules}-${process.platform}-${process.arch}`);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            // nothing to do, since we lazy init
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const db of this.databases.entries()) {
                if (db[1]) {
                    db[1].close();
                }
                this.databases.delete(db[0]);
            }
        });
    }
    getDatabase(type) {
        if (!this.databases.has(type)) {
            this.databases.set(type, new Sqlite3Wrapper(this.dbConfigs.get(type).file, this.dbConfigs.get(type).opts));
        }
        return this.databases.get(type);
    }
}
exports.Database = Database;
//# sourceMappingURL=database.js.map