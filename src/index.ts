import { fileURLToPath } from "url";
import fs from "node:fs";
import pathMod from "node:path";
import { inspect } from "node:util";

import { randomUUID } from "node:crypto";
import { applyOnJSONField } from "./cleanExisting.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathMod.dirname(__filename);

const HELM_VARIABLE_PATTERN = /\{\{ ?.*? ?\}\}/g;

export type CleanRule = [
  fieldKey: string,
  applyFn: (existingValue: any) => any,
];

const RULES: CleanRule[] = [
  //   ["title", () => ""],
  ["uid", () => ""],
];

const variableMap = new Map<string, string>();

const getVariableReplacement = (variable: string): string => {
  const existing = variableMap.get(variable);
  if (existing) {
    return existing;
  }

  const uuid = randomUUID();
  variableMap.set(variable, uuid);
  return uuid;
};

const replaceVariablesWithPlaceholders = (str: string): string => {
  let replacedString = str;
  const matches = replacedString.matchAll(HELM_VARIABLE_PATTERN);

  for (const [key] of matches) {
    const replacement = getVariableReplacement(key);
    replacedString = replacedString.replaceAll(key, replacement);
  }

  return replacedString;
};

const getExistingDashboard = async () => {
  const pathExisting = pathMod.join(
    __dirname,
    "..",
    "existing",
    "overview.json"
  );
  const existingFileStr = await fs.promises.readFile(pathExisting, "utf8");

  const replacedExistingFileStr =
    replaceVariablesWithPlaceholders(existingFileStr);

  const existingJSON = JSON.parse(replacedExistingFileStr);

  return existingJSON;
};

const getImportPanels = async () => {
  const pathImport = pathMod.join(__dirname, "..", "import", "import.json");
  const importFileStr = await fs.promises.readFile(pathImport, "utf8");
  const importJSONPanels = JSON.parse(importFileStr).panels;
  return importJSONPanels;
};

const go = async () => {
  const existingDashboard = await getExistingDashboard();
  const importPanels = await getImportPanels();

  const cleanedImportPanels = applyOnJSONField(importPanels, RULES);

  console.log(
    inspect(cleanedImportPanels, {
      showHidden: true,
      depth: null,
      colors: true,
      breakLength: 200,
    })
  );
};

go();
