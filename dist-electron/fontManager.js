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
  FontManager: () => FontManager
});
module.exports = __toCommonJS(stdin_exports);
var import_child_process = require("child_process");
var import_util = require("util");
var import_path = require("path");
var import_fs = require("fs");
var import_os = require("os");
const execAsync = (0, import_util.promisify)(import_child_process.exec);
class FontManager {
  /**
   * Get detailed information about installed fonts
   */
  async getFontDetails() {
    if (process.platform !== "darwin") {
      throw new Error("Font details currently only supported on macOS");
    }
    try {
      const { stdout } = await execAsync("system_profiler SPFontsDataType -json");
      const fontData = JSON.parse(stdout);
      return fontData.SPFontsDataType || [];
    } catch (error) {
      console.error("Failed to get font details:", error);
      throw error;
    }
  }
  /**
   * Get the path for a specific font by its postscript name
   */
  async getFontPath(fontName) {
    if (process.platform !== "darwin") {
      throw new Error("Font path lookup currently only supported on macOS");
    }
    try {
      const scriptPath = (0, import_path.join)((0, import_os.tmpdir)(), "get_font_path.scpt");
      const script = `
        tell application "Font Book"
          set fontsList to every font
          repeat with aFont in fontsList
            if name of aFont is "${fontName}" then
              return path of aFont as string
            end if
          end repeat
          return ""
        end tell
      `;
      (0, import_fs.writeFileSync)(scriptPath, script);
      const { stdout } = await execAsync(`osascript ${scriptPath}`);
      return stdout.trim() || null;
    } catch (error) {
      console.error("Failed to get font path:", error);
      return null;
    }
  }
  /**
   * Move a font to trash using Font Book on macOS
   */
  async moveToTrash(fontName) {
    if (process.platform !== "darwin") {
      throw new Error("Font deletion currently only supported on macOS");
    }
    try {
      const scriptPath = (0, import_path.join)((0, import_os.tmpdir)(), "delete_font.scpt");
      const script = `
        tell application "Font Book"
          activate
          set fontsList to every font
          repeat with aFont in fontsList
            if name of aFont contains "${fontName}" then
              select aFont
              tell application "System Events"
                tell process "Font Book"
                  click menu item "Remove "${fontName}"" of menu "Edit" of menu bar 1
                  delay 0.5
                  if (exists sheet 1 of window 1) then
                    click button "Remove" of sheet 1 of window 1
                  end if
                end tell
              end tell
              return true
            end if
          end repeat
          return false
        end tell
      `;
      (0, import_fs.writeFileSync)(scriptPath, script);
      const { stdout } = await execAsync(`osascript ${scriptPath}`);
      return stdout.trim() === "true";
    } catch (error) {
      console.error("Failed to move font to trash:", error);
      return false;
    }
  }
  /**
   * Get extended metadata for a specific font
   */
  async getFontMetadata(fontPath) {
    if (process.platform !== "darwin") {
      throw new Error("Font metadata currently only supported on macOS");
    }
    try {
      const { stdout } = await execAsync(`mdls "${fontPath}"`);
      const metadata = {};
      const lines = stdout.split("\n");
      for (const line of lines) {
        const match = line.match(/^([^=]+)\s+=\s+(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          metadata[key] = value;
        }
      }
      return metadata;
    } catch (error) {
      console.error("Failed to get font metadata:", error);
      throw error;
    }
  }
  /**
   * Get OpenType features for a font (using ftxdumperfuser on macOS)
   */
  async getOpenTypeFeatures(fontPath) {
    if (process.platform !== "darwin") {
      throw new Error("OpenType feature detection only supported on macOS");
    }
    try {
      const { stdout } = await execAsync(`ftxdumperfuser "${fontPath}"`);
      const features = [];
      const featureMatch = /OpenType Feature:(.*?)(?=\n\n|\n$)/gs;
      let match;
      while ((match = featureMatch.exec(stdout)) !== null) {
        features.push(match[1].trim());
      }
      return features;
    } catch (error) {
      console.error("Failed to get OpenType features:", error);
      return [];
    }
  }
}
