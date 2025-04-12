import { Font, FontFamily, FontCategory } from '../types';

const FONT_CATEGORIES = {
  SERIF: ['serif', 'roman', 'garamond', 'times', 'georgia'],
  SANS_SERIF: ['sans', 'helvetica', 'arial', 'gothic', 'grotesk'],
  MONOSPACE: ['mono', 'console', 'code', 'terminal'],
  DISPLAY: ['display', 'decorative', 'poster', 'headline'],
  HANDWRITING: ['script', 'hand', 'brush', 'calligraph'],
  ARABIC: ['arabic', 'arabc', 'arab'],
  CHINESE: ['chinese', 'hanzi', 'kanji', 'cjk'],
  KOREAN: ['korean', 'hangul', 'korea'],
  JAPANESE: ['japanese', 'kana', 'hiragana', 'katakana'],
  THAI: ['thai'],
  HEBREW: ['hebrew'],
  DEVANAGARI: ['devanagari', 'hindi'],
};

export function categorizeFonts(fonts: Font[]): FontCategory[] {
  // Group fonts by family first
  const familyMap = new Map<string, Font[]>();
  fonts.forEach(font => {
    const family = font.family.toLowerCase();
    if (!familyMap.has(family)) {
      familyMap.set(family, []);
    }
    familyMap.get(family)?.push(font);
  });

  // Determine category for each family
  const categoryMap = new Map<string, FontFamily[]>();

  familyMap.forEach((fonts, familyName) => {
    const lowercaseName = familyName.toLowerCase();
    const lowercaseStyle = fonts[0].style.toLowerCase();
    const fullNameLower = fonts[0].fullName.toLowerCase();

    let category = 'Miscellaneous';

    // Check against each category's keywords
    for (const [cat, keywords] of Object.entries(FONT_CATEGORIES)) {
      if (keywords.some(keyword => 
        lowercaseName.includes(keyword) || 
        lowercaseStyle.includes(keyword) || 
        fullNameLower.includes(keyword)
      )) {
        category = cat;
        break;
      }
    }

    // Create font family object
    const fontFamily: FontFamily = {
      name: familyName,
      fonts: fonts.sort((a, b) => a.style.localeCompare(b.style)), // Sort styles
      category
    };

    // Add to category map
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)?.push(fontFamily);
  });

  // Convert map to array and sort families within categories
  return Array.from(categoryMap.entries())
    .map(([name, families]) => ({
      name,
      families: families.sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => {
      // Sort categories with specific order
      const order = [
        'SERIF', 'SANS_SERIF', 'MONOSPACE', 'DISPLAY', 'HANDWRITING',
        'ARABIC', 'CHINESE', 'JAPANESE', 'KOREAN', 'THAI', 'HEBREW', 'DEVANAGARI',
        'Miscellaneous'
      ];
      return order.indexOf(a.name) - order.indexOf(b.name);
    });
}