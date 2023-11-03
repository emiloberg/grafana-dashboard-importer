"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
