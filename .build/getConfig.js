"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const CONF_FILE_PATH = node_path_1.default.join(process.cwd(), ".grafana-import.json");
const makePathAbsolute = (path) => node_path_1.default.isAbsolute(path) ? path : node_path_1.default.join(process.cwd(), path);
const getConfig = async () => {
    console.log("Using config file " + CONF_FILE_PATH);
    let confFileStr = null;
    try {
        confFileStr = await node_fs_1.default.promises.readFile(CONF_FILE_PATH, "utf8");
    }
    catch (_) {
        console.log("Can not find config file");
        process.exit(1);
    }
    let conf = null;
    try {
        conf = JSON.parse(confFileStr);
    }
    catch (_) {
        console.log("Can not parse config file");
        process.exit(1);
    }
    if (!conf) {
        console.log("Can not parse config file");
        process.exit(1);
    }
    if (typeof conf.dashboardFile !== "string") {
        console.log("Config must have field 'dashboardFile' with path to existing dashboard file");
        process.exit(1);
    }
    conf.dashboardFile = makePathAbsolute(conf.dashboardFile);
    if (!node_fs_1.default.existsSync(conf.dashboardFile)) {
        console.log("Dashboard file does not exist: " + conf.dashboardFile);
        process.exit(1);
    }
    if (typeof conf.importDir !== "string") {
        console.log("Config must have field 'importDir' with path to folder to read import file(s) from");
        process.exit(1);
    }
    conf.importDir = makePathAbsolute(conf.importDir);
    try {
        node_fs_1.default.accessSync(conf.importDir, node_fs_1.default.constants.R_OK);
    }
    catch (_) {
        console.log("Import directory does not exist: " + conf.importDir);
        process.exit(1);
    }
    if (!Array.isArray(conf.rules)) {
        console.log(`Config must have field 'rules' looking like '"rules": [["uid", ""]]', may be empty`);
        process.exit(1);
    }
    const rules = conf.rules.map(([fieldName, replaceString]) => [
        fieldName,
        () => replaceString,
    ]);
    return {
        ...conf,
        rules,
        cwd: process.cwd(),
    };
};
exports.getConfig = getConfig;
