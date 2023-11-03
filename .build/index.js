"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const cleanExisting_js_1 = require("./cleanExisting.js");
const replaceVariables_js_1 = require("./replaceVariables.js");
const getConfig_js_1 = require("./getConfig.js");
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
