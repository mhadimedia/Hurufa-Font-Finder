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
  // Group fonts by base family name
  const familyMap = new Map<string, Font[]>();
  fonts.forEach(font => {
    // Clean up the family name
    let familyName = font.family
      .replace(/for powerline/i, '')
      .replace(/derivative powerline/i, '')
      .trim();

    // Get the base name based on font naming patterns
    let baseName = familyName;

    // Handle special cases for font families
    if (familyName.startsWith('Noto ')) {
      // For Noto fonts, keep the full name to prevent mixing different scripts
      baseName = familyName;
    } else if (familyName.match(/\b(Mono|Console)\b/i)) {
      // For monospace fonts, keep the full name to prevent mixing different mono fonts
      baseName = familyName;
    } else {
      // For other fonts, clean up common suffixes and prefixes
      baseName = familyName
        .replace(/-(Regular|Bold|Italic|Light|Medium|Black)$/i, '')
        .replace(/\s+(Regular|Bold|Italic|Light|Medium|Black)$/i, '')
        .trim();
    }

    // Create a new font object
    const modifiedFont = { ...font };

    // Add to family map
    if (!familyMap.has(baseName)) {
      familyMap.set(baseName, []);
    }
    familyMap.get(baseName)?.push(modifiedFont);
  });

  // Create separate maps for tags and languages
  const tagMap = new Map<string, FontFamily[]>();
  const languageMap = new Map<string, FontFamily[]>();

  // Process each family
  familyMap.forEach((familyFonts, familyName) => {
    const combinedTags = new Set<string>();
    let representativeLanguage = 'English'; // Default

    // First pass: gather all existing tags and determine a representative language from the family
    familyFonts.forEach(font => {
      if (font.tags) {
        font.tags.forEach(tag => combinedTags.add(tag));
      }
      // Use the language from the first font that has one specified
      if (font.language && representativeLanguage === 'English') { 
        representativeLanguage = font.language;
      }
    });

    // If no font had a language set, detect from family name
    if (representativeLanguage === 'English') {
      representativeLanguage = detectLanguageFromName(familyName);
    }

    // Second pass: add tags based on family name keywords (if not already present)
    const lowerName = familyName.toLowerCase();
    Object.entries(INITIAL_TAGS.Style).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        combinedTags.add(tag); // Add auto-detected tag
      }
    });

    // If no tags found at all (neither custom nor auto-detected), mark as uncategorized
    if (combinedTags.size === 0) {
      combinedTags.add('Uncategorized');
    }

    // Final list of tags for this family
    const finalFamilyTags = Array.from(combinedTags);

    // Update all fonts in this family to have the consistent final tags and language
    familyFonts.forEach(font => {
      font.tags = finalFamilyTags;
      font.language = representativeLanguage; // Ensure language is consistent too
    });

    // Sort fonts by style
    const sortedFonts = [...familyFonts].sort((a, b) => {
      const getWeight = (style: string) => {
        const weights: Record<string, number> = {
          'thin': 100,
          'extralight': 200,
          'light': 300,
          'regular': 400,
          'normal': 400,
          'medium': 500,
          'semibold': 600,
          'bold': 700,
          'extrabold': 800,
          'black': 900
        };

        const lowerStyle = style.toLowerCase();
        for (const [name, weight] of Object.entries(weights)) {
          if (lowerStyle.includes(name)) return weight;
        }
        return 400;
      };

      const aWeight = getWeight(a.style);
      const bWeight = getWeight(b.style);
      
      if (aWeight === bWeight) {
        // If weights are the same, sort by style name
        return a.style.localeCompare(b.style);
      }
      return aWeight - bWeight;
    });

    // Create the font family object
    const fontFamily: FontFamily = {
      name: familyName,
      fonts: sortedFonts,
      tags: finalFamilyTags,
      language: representativeLanguage
    };

    // Add to tag categories
    finalFamilyTags.forEach(tag => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag)?.push(fontFamily);
    });

    // Add to language category
    if (!languageMap.has(representativeLanguage)) {
      languageMap.set(representativeLanguage, []);
    }
    languageMap.get(representativeLanguage)?.push(fontFamily);
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