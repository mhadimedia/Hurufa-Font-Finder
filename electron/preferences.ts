import { app } from 'electron';
import fs from 'fs';
import path from 'path';

const PREFERENCES_FILE = 'preferences.json';

interface Preferences {
  fontSize: number;
  customText: string;
  textColor: string;
  lineHeight: number;
  letterSpacing: number;
  selectedFonts: string[];
  lastSelectedFont: string | null;
  categories: string[];
  [key: string]: any;
}

// Get the path to the preferences file
function getPreferencesPath(): string {
  return path.join(app.getPath('userData'), PREFERENCES_FILE);
}

// Load preferences from file
export function getPreferences(): Preferences {
  const preferencesPath = getPreferencesPath();
  
  try {
    if (fs.existsSync(preferencesPath)) {
      const data = fs.readFileSync(preferencesPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading preferences:', err);
  }
  
  // Return default preferences if file doesn't exist or there's an error
  return {
    fontSize: 24,
    customText: '',
    textColor: '#000000',
    lineHeight: 100,
    letterSpacing: 0,
    selectedFonts: [],
    lastSelectedFont: null,
    categories: []
  };
}

// Save preferences to file
export function savePreferences(preferences: Preferences): void {
  const preferencesPath = getPreferencesPath();
  
  try {
    // Ensure the directory exists
    const dir = path.dirname(preferencesPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save preferences
    fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2));
  } catch (err) {
    console.error('Error saving preferences:', err);
  }
}

// Update a specific preference
export function updatePreference(key: string, value: any): void {
  const preferences = getPreferences();
  preferences[key] = value;
  savePreferences(preferences);
} 