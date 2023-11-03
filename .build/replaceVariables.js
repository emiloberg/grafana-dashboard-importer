"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replacePlaceholdersWithVariables = exports.replaceVariablesWithPlaceholders = void 0;
const node_crypto_1 = require("node:crypto");
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
