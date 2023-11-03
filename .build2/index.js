/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 345:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.applyOnJSONField = void 0;
const isObject = (obj) => {
    return obj != null && obj.constructor.name === "Object";
};
const applyOnJSONField = (obj, rules) => {
    const copy = structuredClone(obj);
    mutateApplyOnJSONField(copy, rules);
    return copy;
};
exports.applyOnJSONField = applyOnJSONField;
const mutateApplyOnJSONField = (obj, rules) => {
    if (Array.isArray(obj)) {
        for (const entry of obj) {
            mutateApplyOnJSONField(entry, rules);
        }
    }
    if (!isObject(obj)) {
        return obj;
    }
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "object") {
            mutateApplyOnJSONField(value, rules);
        }
        else {
            for (const [fieldKey, applyFn] of rules) {
                if (key === fieldKey) {
                    obj[key] = applyFn(value);
                }
            }
        }
    }
};


/***/ }),

/***/ 407:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getConfig = void 0;
const node_fs_1 = __importDefault(__nccwpck_require__(561));
const node_path_1 = __importDefault(__nccwpck_require__(411));
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


/***/ }),

/***/ 997:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const node_fs_1 = __importDefault(__nccwpck_require__(561));
const node_path_1 = __importDefault(__nccwpck_require__(411));
const cleanExisting_js_1 = __nccwpck_require__(345);
const replaceVariables_js_1 = __nccwpck_require__(630);
const getConfig_js_1 = __nccwpck_require__(407);
const getExistingDashboard = async (path) => {
    const existingFileStr = await node_fs_1.default.promises.readFile(path, "utf8");
    /**
     * Before parsing it, we need to replace any Helm variables with placeholders,
     * as the variables may not be valid JSON.
     */
    const replacedExistingFileStr = (0, replaceVariables_js_1.replaceVariablesWithPlaceholders)(existingFileStr);
    const existingJSON = JSON.parse(replacedExistingFileStr);
    return existingJSON;
};
const getImportPanels = async (path) => {
    const filePaths = await node_fs_1.default.promises.readdir(path);
    const jsonFilePaths = filePaths.filter((file) => file.endsWith(".json"));
    const jsonFileContents = await Promise.all(jsonFilePaths.map(async (file) => {
        try {
            const filePath = node_path_1.default.join(path, file);
            console.log("Importing " + filePath);
            const fileContents = await node_fs_1.default.promises.readFile(filePath, "utf8");
            const parsed = JSON.parse(fileContents).panels;
            return parsed;
        }
        catch (_) {
            console.log("Error reading import file " + file);
            process.exit(1);
        }
    }));
    return jsonFileContents;
};
const writeOutput = async (output, outputPath) => {
    await node_fs_1.default.promises.writeFile(outputPath, output);
    console.log("Wrote dashboard " + outputPath);
};
const go = async () => {
    const config = await (0, getConfig_js_1.getConfig)();
    const existingDashboard = await getExistingDashboard(config.dashboardFile);
    const importPanels = await getImportPanels(config.importDir);
    for (const panels of importPanels) {
        const cleanedImportPanels = (0, cleanExisting_js_1.applyOnJSONField)(panels, config.rules);
        const output = {
            ...existingDashboard,
            panels: cleanedImportPanels,
        };
        const outputStr = JSON.stringify(output, null, 2);
        const replacedOutputStr = (0, replaceVariables_js_1.replacePlaceholdersWithVariables)(outputStr);
        await writeOutput(replacedOutputStr, config.dashboardFile);
    }
    console.log("Done!");
};
go();


/***/ }),

/***/ 630:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.replacePlaceholdersWithVariables = exports.replaceVariablesWithPlaceholders = void 0;
const node_crypto_1 = __nccwpck_require__(5);
const HELM_VARIABLE_PATTERN = /\{\{ ?.*? ?\}\}/g;
const variableMap = new Map();
const getVariableReplacement = (variable) => {
    const existing = variableMap.get(variable);
    if (existing) {
        return existing;
    }
    const uuid = (0, node_crypto_1.randomUUID)();
    variableMap.set(variable, uuid);
    return uuid;
};
const replaceVariablesWithPlaceholders = (str) => {
    let replacedString = str;
    const matches = replacedString.matchAll(HELM_VARIABLE_PATTERN);
    for (const [key] of matches) {
        const replacement = getVariableReplacement(key);
        replacedString = replacedString.replaceAll(key, replacement);
    }
    return replacedString;
};
exports.replaceVariablesWithPlaceholders = replaceVariablesWithPlaceholders;
const replacePlaceholdersWithVariables = (str) => {
    let replacedString = str;
    for (const [actualValue, placeholder] of variableMap.entries()) {
        replacedString = replacedString.replaceAll(placeholder, actualValue);
    }
    return replacedString;
};
exports.replacePlaceholdersWithVariables = replacePlaceholdersWithVariables;


/***/ }),

/***/ 5:
/***/ ((module) => {

module.exports = require("node:crypto");

/***/ }),

/***/ 561:
/***/ ((module) => {

module.exports = require("node:fs");

/***/ }),

/***/ 411:
/***/ ((module) => {

module.exports = require("node:path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(997);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;