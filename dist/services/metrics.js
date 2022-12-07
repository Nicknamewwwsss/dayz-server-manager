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
exports.Metrics = void 0;
const metrics_1 = require("../types/metrics");
const logger_1 = require("../util/logger");
const database_1 = require("./database");
class Metrics {
    constructor(manager) {
        this.manager = manager;
        this.log = new logger_1.Logger('Metrics');
        this.initialTimeout = 1000;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.interval) {
                yield this.stop();
            }
            for (const metricKey of Object.keys(metrics_1.MetricTypeEnum)) {
                this.manager.database.getDatabase(database_1.DatabaseTypes.METRICS).run(`
                CREATE TABLE IF NOT EXISTS ${metricKey} (
                    timestamp UNSIGNED BIG INT PRIMARY KEY,
                    value TEXT
                );
            `);
            }
            this.timeout = setTimeout(() => {
                this.timeout = undefined;
                this.interval = setInterval(() => {
                    void this.tick();
                }, this.manager.config.metricPollIntervall);
            }, this.initialTimeout);
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = undefined;
            }
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = undefined;
            }
        });
    }
    pushMetricValue(type, value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.manager.database.getDatabase(database_1.DatabaseTypes.METRICS).run(`
                INSERT INTO ${type} (timestamp, value) VALUES (?, ?)
            `, value.timestamp, JSON.stringify(value.value));
        });
    }
    pushMetric(type, valueFnc) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const value = yield valueFnc();
                if (!!value) {
                    yield this.pushMetricValue(type, {
                        timestamp: new Date().valueOf(),
                        value,
                    });
                }
            }
            catch (_a) {
                // ignore
            }
        });
    }
    tick() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.log(logger_1.LogLevel.DEBUG, 'Tick');
            yield this.pushMetric(metrics_1.MetricTypeEnum.PLAYERS, () => this.manager.rcon.getPlayers());
            yield this.pushMetric(metrics_1.MetricTypeEnum.SYSTEM, () => this.manager.monitor.getSystemReport());
            if (this.manager.config.metricMaxAge && this.manager.config.metricMaxAge > 0) {
                this.deleteMetrics(this.manager.config.metricMaxAge);
            }
        });
    }
    deleteMetrics(maxAge) {
        const delTs = new Date().valueOf() - maxAge;
        for (const key of Object.keys(metrics_1.MetricTypeEnum)) {
            this.manager.database.getDatabase(database_1.DatabaseTypes.METRICS).run(`
                DELETE FROM ${key} WHERE timestamp < ?
            `, delTs);
        }
    }
    fetchMetrics(type, since) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.manager.database.getDatabase(database_1.DatabaseTypes.METRICS).all(`
                SELECT * FROM ${type} WHERE timestamp > ? ORDER BY timestamp ASC
            `, since !== null && since !== void 0 ? since : 0).map((x) => {
                return {
                    timestamp: x.timestamp,
                    value: JSON.parse(x.value),
                };
            });
        });
    }
}
exports.Metrics = Metrics;
//# sourceMappingURL=metrics.js.map