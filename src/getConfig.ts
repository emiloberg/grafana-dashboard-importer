import fs from "node:fs";
import pathMod from "node:path";
import { CleanRule } from "./index.js";

const CONF_FILE_PATH = pathMod.join(process.cwd(), ".grafana-import.json");

type Config = {
  dashboardFile: string;
  importDir: string;
  rules: CleanRule[];
  cwd: string;
};

type SavedConfig = {
  dashboardFile: string;
  importDir: string;
  rules: [string, string][];
};

const makePathAbsolute = (path: string) =>
  pathMod.isAbsolute(path) ? path : pathMod.join(process.cwd(), path);

export const getConfig = async (): Promise<Config> => {
  console.log("Using config file " + CONF_FILE_PATH);
  let confFileStr: string | null = null;
  try {
    confFileStr = await fs.promises.readFile(CONF_FILE_PATH, "utf8");
  } catch (_) {
    console.log("Can not find config file");
    process.exit(1);
  }

  let conf: SavedConfig | null = null;
  try {
    conf = JSON.parse(confFileStr);
  } catch (_) {
    console.log("Can not parse config file");
    process.exit(1);
  }

  if (!conf) {
    console.log("Can not parse config file");
    process.exit(1);
  }

  if (typeof conf.dashboardFile !== "string") {
    console.log(
      "Config must have field 'dashboardFile' with path to existing dashboard file"
    );
    process.exit(1);
  }
  conf.dashboardFile = makePathAbsolute(conf.dashboardFile);
  if (!fs.existsSync(conf.dashboardFile)) {
    console.log("Dashboard file does not exist: " + conf.dashboardFile);
    process.exit(1);
  }

  if (typeof conf.importDir !== "string") {
    console.log(
      "Config must have field 'importDir' with path to folder to read import file(s) from"
    );
    process.exit(1);
  }
  conf.importDir = makePathAbsolute(conf.importDir);

  try {
    fs.accessSync(conf.importDir, fs.constants.R_OK);
  } catch (_) {
    console.log("Import directory does not exist: " + conf.importDir);
    process.exit(1);
  }

  if (!Array.isArray(conf.rules)) {
    console.log(
      `Config must have field 'rules' looking like '"rules": [["uid", ""]]', may be empty`
    );
    process.exit(1);
  }

  const rules: CleanRule[] = conf.rules.map(([fieldName, replaceString]) => [
    fieldName,
    () => replaceString,
  ]);

  return {
    ...conf,
    rules,
    cwd: process.cwd(),
  };
};
