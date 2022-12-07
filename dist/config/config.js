"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = exports.WorkshopMod = exports.Hook = exports.HookTypeEnum = exports.Event = exports.EventTypeEnum = exports.UserLevelEnum = exports.ServerCfg = void 0;
require("reflect-metadata");
/* eslint-disable @typescript-eslint/naming-convention */
class ServerCfg {
    constructor() {
        // General
        /**
         * Server name
         *
         * @required
         */
        this.hostname = 'EXAMPLE NAME';
        /**
         * Maximum amount of players
         *
         * @required
         */
        this.maxPlayers = 60;
        /**
         * Message of the day displayed in the in-game chat
         */
        this.motd = [];
        /**
         * Time interval (in seconds) between each message
         */
        this.motdInterval = 1;
        // Security
        /**
         * Password to connect to the server
         */
        this.password = '';
        /**
         * Password to become a server admin
         */
        this.passwordAdmin = '';
        /**
         * Enable/disable whitelist (value 0-1)
         */
        this.enableWhitelist = 0;
        /**
         * Use BattlEye
         */
        this.BattlEye = 1;
        /**
         * Verifies .pbos against .bisign files. (only 2 is supported)
         *
         * @required
         */
        this.verifySignatures = 2;
        /**
         * When enabled, the server will allow the connection only to clients with same the .exe revision as the server (value 0-1)
         */
        this.forceSameBuild = 1;
        /**
         * Communication protocol used with game server (use only number 1)
         */
        this.guaranteedUpdates = 1;
        /**
         * if set to 1 it will enable connection of clients with "-filePatching" launch parameter enabled
         */
        this.allowFilePatching = 0;
        /**
         * defines Steam query port
         * should fix the issue with server not being visible in client server browser
         */
        this.steamQueryPort = 2305;
        /**
         * Max ping value until server kick the user (value in milliseconds)
         */
        this.maxPing = 200;
        /**
         * enable speedhack detection, values 1-10 (1 strict, 10 benevolent, can be float)
         */
        this.speedhackDetection = 1;
        // VON
        /**
         * Enable/disable voice over network (value 0-1)
         */
        this.disableVoN = 0;
        /**
         * Voice over network codec quality, the higher the better (values 0-30)
         */
        this.vonCodecQuality = 20;
        // Game
        /**
         * Toggles the 3rd person view for players (value 0-1)
         */
        this.disable3rdPerson = 0;
        /**
         * Toggles the cross-hair (value 0-1)
         */
        this.disableCrosshair = 0;
        /**
         * set to 1 to disable damage/destruction of fence and watchtower
         */
        this.disableBaseDamage = 0;
        /**
         * set to 1 to disable damage/destruction of tents, barrels, wooden crate and seachest
         */
        this.disableContainerDamage = 0;
        /**
         * set to 1 to disable the respawn dialog (new characters will be spawning as random)
         */
        this.disableRespawnDialog = 0;
        /**
         * Sets the respawn delay (in seconds) before the player is able to get a new character on the server, when the previous one is dead
         */
        this.respawnTime = 5;
        /**
         * shows info about the character using a debug window in a corner of the screen (value 0-1)
         */
        this.enableDebugMonitor = 1;
        // Time and weather
        /**
         * Disables personal light for all clients connected to server
         */
        this.disablePersonalLight = 1;
        /**
         * 0 for brighter night setup
         * 1 for darker night setup
         */
        this.lightingConfig = 0;
        /**
         * Initial in-game time of the server.
         * "SystemTime" means the local time of the machine.
         * Another possibility is to set the time to some value in "YYYY/MM/DD/HH/MM" format, f.e. "2015/4/8/17/23".
         */
        this.serverTime = 'SystemTime';
        /**
         * Accelerated Time (value 0-24)
         * This is a time multiplier for in-game time.
         * In this case, the time would move 24 times faster than normal, so an entire day would pass in one hour.
         */
        this.serverTimeAcceleration = 12;
        /**
         * Accelerated Nigh Time - The numerical value being a multiplier (0.1-64) and also multiplied by serverTimeAcceleration value.
         * Thus, in case it is set to 4 and serverTimeAcceleration is set to 2, night time would move 8 times faster than normal.
         * An entire night would pass in 3 hours.
         */
        this.serverNightTimeAcceleration = 1;
        /**
         * Persistent Time (value 0-1)
         * The actual server time is saved to storage, so when active, the next server start will use the saved time value.
         */
        this.serverTimePersistent = 0;
        // Performance
        /**
         * The number of players concurrently processed during the login process.
         * Should prevent massive performance drop during connection when a lot of people are connecting at the same time.
         */
        this.loginQueueConcurrentPlayers = 5;
        /**
         * The maximum number of players that can wait in login queue
         */
        this.loginQueueMaxPlayers = 500;
        /**
         * Set limit of how much players can be simulated per frame (for server performance gain)
         */
        this.simulatedPlayersBatch = 20;
        /**
         * enables multi-threaded processing of server's replication system
         * number of worker threads is derived by settings of jobsystem in dayzSettings.xml by "maxcores" and "reservedcores" parameters (value 0-1)
         */
        this.multithreadedReplication = 1;
        /**
         * network bubble distance for spawn of close objects with items in them (f.i. backpacks), set in meters, default value if not set is 20
         */
        this.networkRangeClose = 20;
        /**
         * network bubble distance for spawn (despawn +10%) of near inventory items objects, set in meters, default value if not set is 150
         */
        this.networkRangeNear = 150;
        /**
         * network bubble distance for spawn (despawn +10%) of far objects (other than inventory items), set in meters, default value if not set is 1000
         */
        this.networkRangeFar = 1000;
        /**
         * network bubble distance for spawn of effects (currently only sound effects), set in meters, default value if not set is 4000
         */
        this.networkRangeDistantEffect = 4000;
        /**
         * highest terrain render distance on server (if higher than "viewDistance=" in DayZ client profile, clientside parameter applies)
         */
        this.defaultVisibility = 1375;
        /**
         * highest object render distance on server (if higher than "preferredObjectViewDistance=" in DayZ client profile, clientside parameter applies)
         */
        this.defaultObjectViewDistance = 1375;
        // Persistency
        /**
         * DayZ server instance id, to identify the number of instances per box and their storage folders with persistence files
         *
         * @required
         */
        this.instanceId = 1;
        /**
         * Disable houses/doors persistence (value true/false), usable in case of problems with persistence
         */
        this.storeHouseStateDisabled = false;
        /**
         * Checks if the persistence files are corrupted and replaces corrupted ones with empty ones (value 0-1)
         */
        this.storageAutoFix = 1;
        // Logs
        /**
         * Format for timestamps in the .rpt file (value Full/Short)
         */
        this.timeStampFormat = 'Short';
        /**
         * Logs the average server FPS (value in seconds), needs to have ''-doLogs'' launch parameter active
         */
        this.logAverageFps = 30;
        /**
         * Logs the server memory usage (value in seconds), needs to have the ''-doLogs'' launch parameter active
         */
        this.logMemory = 30;
        /**
         * Logs the count of currently connected players (value in seconds), needs to have the ''-doLogs'' launch parameter active
         */
        this.logPlayers = 30;
        /**
         * Saves the server console log to a file in the folder with the other server logs
         */
        this.logFile = 'server_console.log';
        /**
         * 1 - log player hits only / 0 - log all hits ( animals/infected )
         */
        this.adminLogPlayerHitsOnly = 0;
        /**
         * 1 - log placement action ( traps, tents )
         */
        this.adminLogPlacement = 0;
        /**
         * 1 - log basebuilding actions ( build, dismantle, destroy )
         */
        this.adminLogBuildActions = 0;
        /**
         * 1 - log periodic player list with position every 5 minutes
         */
        this.adminLogPlayerList = 0;
        /**
         * Mission to load on server startup. <MissionName>.<TerrainName>
         * Vanilla mission: dayzOffline.chernarusplus
         * DLC mission: dayzOffline.enoch
         *
         * @required
         */
        this.Missions = {
            DayZ: {
                template: 'dayzOffline.chernarusplus',
            },
        };
        /**
         * 1 - enable cfgGameplayFile
         */
        this.enableCfgGameplayFile = 0;
    }
}
__decorate([
    Reflect.metadata('config-required', true),
    __metadata("design:type", String)
], ServerCfg.prototype, "hostname", void 0);
__decorate([
    Reflect.metadata('config-required', true),
    __metadata("design:type", Number)
], ServerCfg.prototype, "maxPlayers", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "enableWhitelist", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "BattlEye", void 0);
__decorate([
    Reflect.metadata('config-required', true),
    Reflect.metadata('config-range', [0, 2]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "verifySignatures", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "forceSameBuild", void 0);
__decorate([
    Reflect.metadata('config-range', [1, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "guaranteedUpdates", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "allowFilePatching", void 0);
__decorate([
    Reflect.metadata('config-range', [1, 10]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "speedhackDetection", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "disableVoN", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 30]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "vonCodecQuality", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "disable3rdPerson", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "disableBaseDamage", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "disableContainerDamage", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "disableRespawnDialog", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "enableDebugMonitor", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "disablePersonalLight", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "lightingConfig", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "serverTimePersistent", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "multithreadedReplication", void 0);
__decorate([
    Reflect.metadata('config-required', true),
    __metadata("design:type", Object)
], ServerCfg.prototype, "instanceId", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "storageAutoFix", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "adminLogPlayerHitsOnly", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "adminLogPlacement", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "adminLogBuildActions", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "adminLogPlayerList", void 0);
__decorate([
    Reflect.metadata('config-required', true),
    __metadata("design:type", Object)
], ServerCfg.prototype, "Missions", void 0);
__decorate([
    Reflect.metadata('config-range', [0, 1]),
    __metadata("design:type", Number)
], ServerCfg.prototype, "enableCfgGameplayFile", void 0);
exports.ServerCfg = ServerCfg;
// eslint-disable-next-line no-shadow
var UserLevelEnum;
(function (UserLevelEnum) {
    UserLevelEnum["admin"] = "admin";
    UserLevelEnum["manage"] = "manage";
    UserLevelEnum["moderate"] = "moderate";
    UserLevelEnum["view"] = "view";
})(UserLevelEnum = exports.UserLevelEnum || (exports.UserLevelEnum = {}));
// eslint-disable-next-line no-shadow
var EventTypeEnum;
(function (EventTypeEnum) {
    EventTypeEnum["restart"] = "restart";
    EventTypeEnum["message"] = "message";
    EventTypeEnum["kickAll"] = "kickAll";
    EventTypeEnum["lock"] = "lock";
    EventTypeEnum["unlock"] = "unlock";
    EventTypeEnum["backup"] = "backup";
})(EventTypeEnum = exports.EventTypeEnum || (exports.EventTypeEnum = {}));
/* eslint-enable @typescript-eslint/naming-convention */
class Event {
}
exports.Event = Event;
/* eslint-disable @typescript-eslint/naming-convention */
// eslint-disable-next-line no-shadow
var HookTypeEnum;
(function (HookTypeEnum) {
    HookTypeEnum["beforeStart"] = "beforeStart";
    HookTypeEnum["missionChanged"] = "missionChanged";
})(HookTypeEnum = exports.HookTypeEnum || (exports.HookTypeEnum = {}));
/* eslint-enable @typescript-eslint/naming-convention */
class Hook {
}
exports.Hook = Hook;
class WorkshopMod {
}
exports.WorkshopMod = WorkshopMod;
class Config {
    constructor() {
        /**
         * The instance name of this server
         * @required
         */
        this.instanceId = 'dayz';
        /**
         * Manager log level
         */
        this.loglevel = 1;
        // /////////////////////////// Admins /////////////////////////////////////
        /**
         * The web or discord users allowed to use the web interface or the bot commands and which of them
         *
         * level can be one of:
         *  admin - guess what? ... everything
         *  manage - able to perform management tasks such as restarts and updates (and everything below)
         *  moderate - able to perform moderation tasks such as server messages, kicks and bans (and everything below)
         *  view - able to query the server status and ingame situation (ie. player list, objects, etc)
         *
         * if the id does not contain a '#', the user is exclusive to webview
         * the password is only used for the web interface and API
         *
         * example:
         * {
         *     "userId": "Senfo#5128",
         *     "password": "admin",
         *     "userLevel": "admin"
         * }
         *
         * @required
         */
        this.admins = [
            {
                userId: 'admin',
                userLevel: 'admin',
                password: 'admin',
            },
        ];
        // /////////////////////////// WEB ////////////////////////////////////////
        /**
         * The port of the web interface and REST API
         *
         * if -1 or 0 it will be serverport + 11
         */
        this.webPort = 0;
        /**
         * Whether or not to publish the WebUI or not
         *
         * if this is enabled, the webserver host is 0.0.0.0 rather than localhost
         * this can be a security risk, so better leave this turned off if you dont know what this means
         * and use a browser on your server to connect to the web ui via localhost
         *
         * if you want to publish the web ui, it is recommended to use a reverse proxy (such as nginx)
         * and secure the connection to the reverse proxy with a SSL Cert for HTTPS
         * (because this app wont provide HTTPS capabilities)
         */
        this.publishWebServer = false;
        // /////////////////////////// Discord ////////////////////////////////////
        /**
         * Bot Token for Discord
         * Leave it empty to disable the bot
         */
        this.discordBotToken = '';
        /**
         * Channels the discord commands will work in
         * by default (if the channel is not listed), only public discord commands are allowed
         *
         * Modes:
         * 'admin' - admin commands are allowed in this channel
         * 'rcon' - rcon relay (rcon messages will be posted there)
         */
        this.discordChannels = [];
        // /////////////////////////// DayZ ///////////////////////////////////////
        /**
         * Use the experimental server or not
         * Default is false
         */
        this.experimentalServer = false;
        /**
         * Path to server
         * Default is current directory (PWD / CWD) + DayZServer
         */
        this.serverPath = 'DayZServer';
        /**
         * Name of the server exe (Default is DayZServer_x64.exe)
         */
        this.serverExe = 'DayZServer_x64.exe';
        /**
         * Servers Game Port
         */
        this.serverPort = 2302;
        /**
         * Path to server cfg
         */
        this.serverCfgPath = 'serverDZ.cfg';
        /**
         * Path to profiles
         */
        this.profilesPath = 'profiles';
        /**
         * Path to battleye
         * Only set this if you know what your are doing
         */
        this.battleyePath = '';
        /**
         * RCon Credentials
         * @required
         */
        this.rconPassword = 'rcon';
        /**
         * RCon Port as required by DayZ Update 1.13 (https://feedback.bistudio.com/T159179)
         * The default is 2306 to avoid any colissions
         */
        this.rconPort = 2306;
        /**
         * Local mods
         * Actual modnames like '@MyAwesomeMod'
         */
        this.localMods = [];
        /**
         * Server mods
         * Actual modnames like '@MyAwesomeMod'
         */
        this.serverMods = [];
        /**
         * Server Startup Param doLogs
         */
        this.doLogs = true;
        /**
         * Server Startup Param adminLog
         */
        this.adminLog = true;
        /**
         * Server Startup Param netLog
         */
        this.netLog = false;
        /**
         * Server Startup Param freezeCheck
         */
        this.freezeCheck = true;
        /**
         * Server Startup Param filePatching
         */
        this.filePatching = false;
        /**
         * Server Startup Param scriptDebug
         */
        this.scriptDebug = true;
        /**
         * Server Startup Param scrAllowFileWrite
         */
        this.scrAllowFileWrite = true;
        /**
         * Server Startup Param limitFps
         */
        this.limitFPS = -1;
        /**
         * Server Startup Param cpuCount
         */
        this.cpuCount = -1;
        /**
         * Server Startup Params (manual)
         */
        this.serverLaunchParams = [];
        /**
         * Time (in ms) between each server check
         */
        this.serverProcessPollIntervall = 30000;
        // /////////////////////////// Backups ////////////////////////////////////////
        /**
         * Path where backups are stored
         * Default is current directory (PWD / CWD) + backups
         *
         * To schedule backups, use the the event scheduler and the event type 'backup'
         *
         * To restore backups:
         * - delete the mpmissions folder in the server folder
         * - go to the backup folder
         * - copy the mpmissions_{date} you want to restore into the server folder
         * - rename the copied folder back to mpmissions
         */
        this.backupPath = 'backups';
        /**
         * Max age of backups in days
         * Default is one week
         */
        this.backupMaxAge = 7;
        // /////////////////////////// Steam ////////////////////////////////////////
        /**
         * Path to steam CMD
         * Default is current directory (PWD / CWD) + SteamCMD
         */
        this.steamCmdPath = 'SteamCMD';
        /**
         * Username for steam CMD
         * @required
         */
        this.steamUsername = '';
        /**
         * Optional if password is cached (manually logged in once)
         */
        this.steamPassword = '';
        /**
         * Path to where the downloaded mods are located (relative or absolute)
         * Default is current directory (PWD / CWD) + Workshop
         *
         * Note: this is the folder that containes: steamapps/workshop/content/221100
         *
         * Note2: we want this to be a folder outside the steamcmd folder
         *  so we can delete the steamcmd folder in case of errors
         */
        this.steamWorkshopPath = 'Workshop';
        /**
         * List of Mod IDs (workshop id, not modname!) the server should use
         */
        this.steamWsMods = [];
        /**
         * Whether or not to check for mod updates on each server restart
         */
        this.updateModsBeforeServerStart = true;
        /**
         * Whether or not to check for mod updates when the manager is started
         */
        this.updateModsOnStartup = true;
        /**
         * Whether or not to check for server updates on each server restart
         */
        this.updateServerBeforeServerStart = true;
        /**
         * Whether or not to check for mod updates when the manager is started
         */
        this.updateServerOnStartup = true;
        /**
         * Whether or not to use hardlink for mods instead of copying them
         */
        this.linkModDirs = false;
        /**
         * Whether to deep compare mods instead of just checking for update timestamps
         */
        this.copyModDeepCompare = false;
        // /////////////////////////// Events ///////////////////////////////////////
        /**
         * Events are actions which can be scheduled to run at a given point in time or frequently
         *
         * Events are defined by:
         * name - string - name of the event
         * cron - string - the cron format of when to execute this action
         * params - string[] - optional params, e.g. the message
        *
        * Types:
         * 'restart' - restarts the server
         * 'message' - sends a global messages to all players
         * 'kickAll' - kicks all players
         * 'lock' - locks the server (probably not working)
         * 'unlock' - unlocks the server (probably not working)
         * 'backup' - creates backup of mpmissions folder
         *
         *
         * CRON - Format:
         * ┌────────────── second (optional)
         * │ ┌──────────── minute
         * │ │ ┌────────── hour
         * │ │ │ ┌──────── day of month
         * │ │ │ │ ┌────── month
         * │ │ │ │ │ ┌──── day of week
         * │ │ │ │ │ │
         * │ │ │ │ │ │
         * * * * * * *
         *
         * Examples:
         *
         * List:
         * '1,4,5 * * * *' - executes every first, fourth and fifth minute (i.e.: ... 15:05, 16:01, 16:04, 16:05, 17:01, 17:04, 17:05 ...)
         * Range:
         * '1-5 * * * *' - executes every 1,2,3,4,5 minute (i.e.: ... 15:05, 16:01, 16:02, 16:03, 16:04, 16:05, 17:01...)
         * Multiples:
         * '0/2 * * * *' - executes every two minutes (i.e.: ... 16:02, 16:04, 16:06, 16:08 ...)
         * Combinations:
         * '1-6/2 * * * *' - executes every two minutes in 1-10 range (i.e.: ... 15:06, 16:02, 16:04, 16:06, 17:02 ...)
         *
         * You can generate and test cron formats with:
         * https://crontab.guru/
         * https://www.freeformatter.com/cron-expression-generator-quartz.html
         * https://cronjob.xyz/
         */
        this.events = [];
        /**
         * Time (in ms) between each metric tick (read players, system status, etc.)
         */
        this.metricPollIntervall = 10000;
        /**
         * Time (in ms) after which metrics will be removed (tick by tick)
         * Default is 30 days
         */
        this.metricMaxAge = 2592000;
        // /////////////////////////// Hooks ///////////////////////////////////////
        /**
         * Hooks to define custom behaviour when certain events happen
         */
        this.hooks = [];
        // /////////////////////////// ServerCfg ///////////////////////////////////////
        /**
         * serverCfg
         */
        this.serverCfg = new ServerCfg();
    }
}
__decorate([
    Reflect.metadata('config-required', true),
    __metadata("design:type", String)
], Config.prototype, "instanceId", void 0);
__decorate([
    Reflect.metadata('config-required', true),
    __metadata("design:type", Array)
], Config.prototype, "admins", void 0);
__decorate([
    Reflect.metadata('config-range', [-1, 65535]),
    __metadata("design:type", Number)
], Config.prototype, "webPort", void 0);
__decorate([
    Reflect.metadata('config-range', [-1, 65535]),
    __metadata("design:type", Number)
], Config.prototype, "serverPort", void 0);
__decorate([
    Reflect.metadata('config-required', true),
    __metadata("design:type", String)
], Config.prototype, "rconPassword", void 0);
__decorate([
    Reflect.metadata('config-required', true),
    __metadata("design:type", String)
], Config.prototype, "steamUsername", void 0);
__decorate([
    Reflect.metadata('config-required', true),
    __metadata("design:type", ServerCfg)
], Config.prototype, "serverCfg", void 0);
exports.Config = Config;
//# sourceMappingURL=config.js.map