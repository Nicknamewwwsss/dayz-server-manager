"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigFileHelper = void 0;
const fs = require("fs");
const path = require("path");
const logger_1 = require("../util/logger");
const merge_1 = require("../util/merge");
const paths_1 = require("../util/paths");
const config_1 = require("./config");
const config_template_1 = require("./config-template");
const config_validate_1 = require("./config-validate");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const configschema = require('./config.schema.json');
class ConfigFileHelper {
    constructor() {
        this.log = new logger_1.Logger('Config');
        this.paths = new paths_1.Paths();
    }
    getConfigFilePath() {
        return path.join(this.paths.cwd(), 'server-manager.json');
    }
    getConfigFileContent(cfgPath) {
        var _a;
        if (fs.existsSync(cfgPath)) {
            return (_a = fs.readFileSync(cfgPath)) === null || _a === void 0 ? void 0 : _a.toString();
        }
        throw new Error('Config file does not exist');
    }
    logConfigErrors(errors) {
        this.log.log(logger_1.LogLevel.ERROR, 'Config has errors:');
        for (const configError of errors) {
            this.log.log(logger_1.LogLevel.ERROR, configError);
        }
    }
    readConfig() {
        try {
            const cfgPath = this.getConfigFilePath();
            this.log.log(logger_1.LogLevel.IMPORTANT, `Trying to read config at: ${cfgPath}`);
            const fileContent = this.getConfigFileContent(cfgPath);
            // apply defaults
            const parsed = merge_1.merge(new config_1.Config(), config_validate_1.parseConfigFileContent(fileContent));
            const configErrors = config_validate_1.validateConfig(parsed);
            if (configErrors === null || configErrors === void 0 ? void 0 : configErrors.length) {
                this.logConfigErrors(configErrors);
                return null;
            }
            this.log.log(logger_1.LogLevel.IMPORTANT, 'Successfully read config');
            return parsed;
        }
        catch (e) {
            this.log.log(logger_1.LogLevel.ERROR, `Error reading config: ${e.message}`, e);
            return null;
        }
    }
    writeConfig(config) {
        var _a;
        // apply defaults
        config = merge_1.merge(new config_1.Config(), config);
        const configErrors = config_validate_1.validateConfig(config);
        if (configErrors === null || configErrors === void 0 ? void 0 : configErrors.length) {
            throw ['New config contains errors. Cannot replace config.', ...configErrors];
        }
        try {
            this.writeConfigFile(config_template_1.generateConfigTemplate(configschema, config));
        }
        catch (e) {
            throw [`Error generating / writing config (${(_a = e === null || e === void 0 ? void 0 : e.message) !== null && _a !== void 0 ? _a : 'Unknown'}). Cannot replace config.`];
        }
    }
    writeConfigFile(content) {
        fs.writeFileSync(this.getConfigFilePath(), content);
    }
}
exports.ConfigFileHelper = ConfigFileHelper;
//# sourceMappingURL=config-file-helper.js.map