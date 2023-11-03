import { CleanRule } from "./index.js";

const isObject = (obj: any) => {
  return obj != null && obj.constructor.name === "Object";
};

export const applyOnJSONField = (obj: any, rules: CleanRule[]) => {
  const copy = structuredClone(obj);
  mutateApplyOnJSONField(copy, rules);
  return copy;
};

const mutateApplyOnJSONField = (obj: any, rules: CleanRule[]) => {
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
    } else {
      for (const [fieldKey, applyFn] of rules) {
        if (key === fieldKey) {
          obj[key] = applyFn(value);
        }
      }
    }
  }
};
