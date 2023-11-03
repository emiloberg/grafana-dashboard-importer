import { randomUUID } from "node:crypto";
const HELM_VARIABLE_PATTERN = /\{\{ ?.*? ?\}\}/g;

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

export const replaceVariablesWithPlaceholders = (str: string): string => {
  let replacedString = str;
  const matches = replacedString.matchAll(HELM_VARIABLE_PATTERN);

  for (const [key] of matches) {
    const replacement = getVariableReplacement(key);
    replacedString = replacedString.replaceAll(key, replacement);
  }

  return replacedString;
};

export const replacePlaceholdersWithVariables = (str: string): string => {
  let replacedString = str;

  for (const [actualValue, placeholder] of variableMap.entries()) {
    replacedString = replacedString.replaceAll(placeholder, actualValue);
  }

  return replacedString;
};
