import fs from "node:fs";
import pathMod from "node:path";

import { applyOnJSONField } from "./cleanExisting.js";
import {
  replacePlaceholdersWithVariables,
  replaceVariablesWithPlaceholders,
} from "./replaceVariables.js";
import { getConfig } from "./getConfig.js";

export type CleanRule = [
  fieldKey: string,
  applyFn: (existingValue: any) => any,
];

const RULES: CleanRule[] = [
  //   ["title", () => ""],
  ["uid", () => ""],
];

const getExistingDashboard = async (path: string) => {
  const existingFileStr = await fs.promises.readFile(path, "utf8");

  /**
   * Before parsing it, we need to replace any Helm variables with placeholders,
   * as the variables may not be valid JSON.
   */
  const replacedExistingFileStr =
    replaceVariablesWithPlaceholders(existingFileStr);

  const existingJSON = JSON.parse(replacedExistingFileStr);

  return existingJSON;
};

const getImportPanels = async (path: string) => {
  const filePaths = await fs.promises.readdir(path);

  const jsonFilePaths = filePaths.filter((file) => file.endsWith(".json"));

  const jsonFileContents = await Promise.all(
    jsonFilePaths.map(async (file) => {
      try {
        const filePath = pathMod.join(path, file);
        console.log("Importing " + filePath);
        const fileContents = await fs.promises.readFile(filePath, "utf8");
        const parsed = JSON.parse(fileContents).panels;
        return parsed;
      } catch (_) {
        console.log("Error reading import file " + file);
        process.exit(1);
      }
    })
  );

  return jsonFileContents;
};

const writeOutput = async (output: string, outputPath: string) => {
  await fs.promises.writeFile(outputPath, output);
  console.log("Wrote dashboard " + outputPath);
};

const go = async () => {
  const config = await getConfig();

  const existingDashboard = await getExistingDashboard(config.dashboardFile);
  const importPanels = await getImportPanels(config.importDir);

  for (const panels of importPanels) {
    const cleanedImportPanels = applyOnJSONField(panels, RULES);
    const output = {
      ...existingDashboard,
      panels: cleanedImportPanels,
    };
    const outputStr = JSON.stringify(output, null, 2);
    const replacedOutputStr = replacePlaceholdersWithVariables(outputStr);
    await writeOutput(replacedOutputStr, config.dashboardFile);
  }

  console.log("Done!");
};

go();
