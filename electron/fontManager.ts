import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

/**
 * Font Manager - Native operations for font management
 * Currently macOS focused with plans to add Windows support
 */
export class FontManager {
  /**
   * Get detailed information about installed fonts
   */
  async getFontDetails(): Promise<any[]> {
    if (process.platform !== 'darwin') {
      throw new Error('Font details currently only supported on macOS');
    }

    try {
      // Execute the system_profiler command to get detailed font info
      const { stdout } = await execAsync('system_profiler SPFontsDataType -json');
      const fontData = JSON.parse(stdout);
      return fontData.SPFontsDataType || [];
    } catch (error: any) {
      console.error('Failed to get font details:', error);
      throw error;
    }
  }

  /**
   * Get the path for a specific font by its postscript name
   */
  async getFontPath(fontName: string): Promise<string | null> {
    if (process.platform !== 'darwin') {
      throw new Error('Font path lookup currently only supported on macOS');
    }

    try {
      // Create a temporary AppleScript file
      const scriptPath = join(tmpdir(), 'get_font_path.scpt');
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
      writeFileSync(scriptPath, script);

      // Run the AppleScript
      const { stdout } = await execAsync(`osascript ${scriptPath}`);
      return stdout.trim() || null;
    } catch (error: any) {
      console.error('Failed to get font path:', error);
      return null;
    }
  }

  /**
   * Move a font to trash using Font Book on macOS
   */
  async moveToTrash(fontName: string): Promise<boolean> {
    if (process.platform !== 'darwin') {
      throw new Error('Font deletion currently only supported on macOS');
    }

    try {
      // Create a temporary AppleScript file
      const scriptPath = join(tmpdir(), 'delete_font.scpt');
      const script = `
        tell application "Font Book"
          activate
          set fontsList to every font
          repeat with aFont in fontsList
            if name of aFont contains "${fontName}" then
              select aFont
              tell application "System Events"
                tell process "Font Book"
                  click menu item "Remove \"${fontName}\"" of menu "Edit" of menu bar 1
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
      writeFileSync(scriptPath, script);

      // Run the AppleScript
      const { stdout } = await execAsync(`osascript ${scriptPath}`);
      return stdout.trim() === 'true';
    } catch (error: any) {
      console.error('Failed to move font to trash:', error);
      return false;
    }
  }

  /**
   * Get extended metadata for a specific font
   */
  async getFontMetadata(fontPath: string): Promise<any> {
    if (process.platform !== 'darwin') {
      throw new Error('Font metadata currently only supported on macOS');
    }

    try {
      // Use mdls (metadata listing) command to get file metadata
      const { stdout } = await execAsync(`mdls "${fontPath}"`);
      
      // Parse the output into a structured object
      const metadata: Record<string, any> = {};
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        const match = line.match(/^([^=]+)\s+=\s+(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          
          // Remove quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          
          metadata[key] = value;
        }
      }
      
      return metadata;
    } catch (error: any) {
      console.error('Failed to get font metadata:', error);
      throw error;
    }
  }

  /**
   * Get OpenType features for a font (using ftxdumperfuser on macOS)
   */
  async getOpenTypeFeatures(fontPath: string): Promise<string[]> {
    if (process.platform !== 'darwin') {
      throw new Error('OpenType feature detection only supported on macOS');
    }

    try {
      // ftxdumperfuser is a macOS tool for dumping font tables
      const { stdout } = await execAsync(`ftxdumperfuser "${fontPath}"`);
      
      // Extract OpenType features
      const features: string[] = [];
      const featureMatch = /OpenType Feature:(.*?)(?=\n\n|\n$)/gs;
      
      let match;
      while ((match = featureMatch.exec(stdout)) !== null) {
        features.push(match[1].trim());
      }
      
      return features;
    } catch (error: any) {
      console.error('Failed to get OpenType features:', error);
      return [];
    }
  }
} 