import { Font, FontFamily, FontCategory, CategoryType } from '../types';

const INITIAL_TAGS = {
  'Style': {
    'Serif': ['serif'],
    'Sans Serif': ['sans'],
    'Monospace': ['mono', 'console'],
    'Display': ['display'],
    'Script': ['script', 'hand']
  }
};

const LANGUAGE_KEYWORDS = {
  'Arabic': ['arabic', 'arabc', 'arab'],
  'Chinese': ['chinese', 'hanzi', 'kanji', 'cjk'],
  'Korean': ['korean', 'hangul'],
  'Japanese': ['japanese', 'kana', 'hiragana', 'katakana'],
  'Thai': ['thai'],
  'Hebrew': ['hebrew'],
  'Devanagari': ['devanagari', 'hindi']
};

// Helper function to detect language from font name
export function detectLanguageFromName(fontName: string): string {
  const lowerName = fontName.toLowerCase();
  for (const [language, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return language;
    }
  }
  return 'English';
}

export function categorizeFonts(fonts: Font[]): FontCategory[] {
  // Group fonts by family
  const familyMap = new Map<string, Font[]>();
  fonts.forEach(font => {
    if (!familyMap.has(font.family)) {
      familyMap.set(font.family, []);
    }
    familyMap.get(font.family)?.push(font);
  });

  // Create separate maps for tags and languages
  const tagMap = new Map<string, FontFamily[]>();
  const languageMap = new Map<string, FontFamily[]>();

  // Process each family
  familyMap.forEach((fonts, familyName) => {
    const tags = new Set<string>();
    const mainFont = fonts[0];
    
    // Get language from the font if set, otherwise detect from name
    const language = mainFont.language || detectLanguageFromName(familyName);

    // First check for style tags in the font name
    const lowerName = familyName.toLowerCase();
    Object.entries(INITIAL_TAGS.Style).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        tags.add(tag);
      }
    });

    // Then add any existing custom tags from the font
    if (mainFont.tags) {
      mainFont.tags.forEach(tag => tags.add(tag));
    }

    // If no tags found, mark as uncategorized
    if (tags.size === 0) {
      tags.add('Uncategorized');
    }

    // Update the font's tags to include auto-detected ones
    const updatedTags = Array.from(tags);
    fonts.forEach(font => {
      font.tags = updatedTags;
    });

    // Create the font family object
    const fontFamily: FontFamily = {
      name: familyName,
      fonts: fonts.sort((a, b) => a.style.localeCompare(b.style)),
      tags: updatedTags,
      language
    };

    // Add to tag categories
    tags.forEach(tag => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag)?.push(fontFamily);
    });

    // Add to language category
    if (!languageMap.has(language)) {
      languageMap.set(language, []);
    }
    languageMap.get(language)?.push(fontFamily);
  });

  // Convert maps to arrays and sort
  const tagCategories = Array.from(tagMap.entries())
    .map(([name, families]) => ({
      name,
      type: CategoryType.TAG,
      families: families.sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const languageCategories = Array.from(languageMap.entries())
    .map(([name, families]) => ({
      name,
      type: CategoryType.LANGUAGE,
      families: families.sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...tagCategories, ...languageCategories];
}