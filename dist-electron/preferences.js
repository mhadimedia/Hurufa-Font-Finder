var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  getPreferences: () => getPreferences,
  savePreferences: () => savePreferences,
  updatePreference: () => updatePreference
});
module.exports = __toCommonJS(stdin_exports);
var import_electron = require("electron");
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
const PREFERENCES_FILE = "preferences.json";
function getPreferencesPath() {
  return import_path.default.join(import_electron.app.getPath("userData"), PREFERENCES_FILE);
}
function getPreferences() {
  const preferencesPath = getPreferencesPath();
  try {
    if (import_fs.default.existsSync(preferencesPath)) {
      const data = import_fs.default.readFileSync(preferencesPath, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error loading preferences:", err);
  }
  return {
    fontSize: 24,
    customText: "",
    textColor: "#000000",
    lineHeight: 100,
    letterSpacing: 0,
    selectedFonts: [],
    lastSelectedFont: null,
    categories: []
  };
}
function savePreferences(preferences) {
  const preferencesPath = getPreferencesPath();
  try {
    const dir = import_path.default.dirname(preferencesPath);
    if (!import_fs.default.existsSync(dir)) {
      import_fs.default.mkdirSync(dir, { recursive: true });
    }
    import_fs.default.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2));
  } catch (err) {
    console.error("Error saving preferences:", err);
  }
}
function updatePreference(key, value) {
  const preferences = getPreferences();
  preferences[key] = value;
  savePreferences(preferences);
}
