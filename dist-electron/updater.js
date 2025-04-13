var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  checkForUpdates: () => checkForUpdates
});
module.exports = __toCommonJS(stdin_exports);
var import_electron_updater = require("electron-updater");
var import_electron = require("electron");
var import_preferences = require("./preferences");
import_electron_updater.autoUpdater.autoDownload = false;
import_electron_updater.autoUpdater.autoInstallOnAppQuit = true;
import_electron_updater.autoUpdater.allowDowngrade = true;
import_electron_updater.autoUpdater.allowPrerelease = false;
import_electron_updater.autoUpdater.disableWebInstaller = false;
import_electron_updater.autoUpdater.requiresUpdateClientCertificate = false;
import_electron_updater.autoUpdater.isUpdaterActive = () => true;
import_electron_updater.autoUpdater.forceDevUpdateConfig = true;
import_electron_updater.autoUpdater.logger = console;
import_electron_updater.autoUpdater.verifyUpdateCodeSignature = false;
import_electron_updater.autoUpdater.signatureVerificationDisabled = true;
const preferences = (0, import_preferences.getPreferences)();
setInterval(() => {
  import_electron_updater.autoUpdater.checkForUpdates();
}, 6 * 60 * 60 * 1e3);
import_electron_updater.autoUpdater.on("checking-for-update", () => {
  console.log("Checking for updates...");
});
import_electron_updater.autoUpdater.on("update-available", (info) => {
  console.log("Update available:", info.version);
  import_electron.dialog.showMessageBox({
    type: "info",
    title: "Update Available",
    message: `A new version (${info.version}) of Font Organizer is available. Would you like to download and install it now?`,
    buttons: ["Download", "Later"],
    defaultId: 0,
    cancelId: 1
  }).then(({ response }) => {
    if (response === 0) {
      import_electron_updater.autoUpdater.downloadUpdate();
    }
  });
});
import_electron_updater.autoUpdater.on("update-not-available", () => {
  console.log("No updates available");
});
import_electron_updater.autoUpdater.on("download-progress", (progressObj) => {
  console.log("Download progress:", progressObj.percent);
});
import_electron_updater.autoUpdater.on("update-downloaded", (info) => {
  console.log("Update downloaded:", info.version);
  (0, import_preferences.savePreferences)(preferences);
  import_electron.dialog.showMessageBox({
    type: "info",
    title: "Update Ready",
    message: `Version ${info.version} has been downloaded. Would you like to install it now?`,
    buttons: ["Install and Restart", "Later"],
    defaultId: 0,
    cancelId: 1
  }).then(({ response }) => {
    if (response === 0) {
      import_electron_updater.autoUpdater.quitAndInstall();
    }
  });
});
import_electron_updater.autoUpdater.on("error", (err) => {
  console.error("Error in auto-updater:", err);
  import_electron.dialog.showErrorBox("Update Error", err.message);
});
function checkForUpdates() {
  import_electron_updater.autoUpdater.checkForUpdates();
}
