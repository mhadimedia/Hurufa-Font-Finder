import { create } from 'zustand';
import { Font, FontCategory } from './types';
import { categorizeFonts } from './utils/fontUtils';
import JSZip from 'jszip';

// Helper function to get font data from the system
async function getFontData(font: Font): Promise<ArrayBuffer | null> {
  try {
    // Request permission to access local fonts
    // @ts-expect-error - Font Access API
    if (!window.queryLocalFonts) {
      throw new Error('Font Access API is not available');
    }

    try {
      // @ts-expect-error - Font Access API
      await window.queryLocalFonts();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'SecurityError') {
        throw new Error('Please grant permission to access local fonts');
      }
      throw err;
    }

    // @ts-expect-error - Font Access API
    const fontData = await window.queryLocalFonts();
    
    // Try different matching strategies
    const matchingFont = fontData.find((f: any) => {
      // Try exact postscript name match first
      if (f.postscriptName && font.postscriptName && 
          f.postscriptName.toLowerCase() === font.postscriptName.toLowerCase()) {
        return true;
      }
      
      // Then try full name match
      if (f.fullName && font.fullName && 
          f.fullName.toLowerCase() === font.fullName.toLowerCase()) {
        return true;
      }
      
      // Finally try family + style match
      return f.family === font.family && 
             (f.style === font.style || f.fullName?.includes(font.style));
    });

    if (!matchingFont) {
      throw new Error(`Could not find font: ${font.family} ${font.style}`);
    }

    // Get the font data
    try {
      const blob = await matchingFont.blob();
      return await new Response(blob).arrayBuffer();
    } catch (err) {
      console.error('Failed to get font blob:', err);
      throw new Error(`Failed to get font data for ${font.family} ${font.style}`);
    }
  } catch (err) {
    console.error('Failed to get font data:', err);
    throw err;
  }
}

// Helper function to determine font type
function getFontType(font: Font): 'otf' | 'ttf' {
  // Check postscript name first
  const postscriptName = font.postscriptName?.toLowerCase() || '';
  if (postscriptName.includes('.otf')) return 'otf';
  if (postscriptName.includes('.ttf')) return 'ttf';
  
  // Check full name next
  const fullName = font.fullName?.toLowerCase() || '';
  if (fullName.includes('.otf')) return 'otf';
  if (fullName.includes('.ttf')) return 'ttf';
  
  // Default to ttf if we can't determine
  return 'ttf';
}

interface StoreState {
  fonts: Font[];
  fontCategories: FontCategory[];
  loading: boolean;
  error: string | null;
  // Font customization state
  fontSize: number;
  customText: string;
  textColor: string;
  lineHeight: number;
  letterSpacing: number;
  // Selection state
  selectedFonts: Set<string>; // Using postscriptName as unique identifier
  lastSelectedFont: string | null;
  // New properties for extended font information
  fontMetadata: Map<string, any>;
  fontFeatures: Map<string, string[]>;
  // Actions
  setFonts: (fonts: Font[]) => void;
  setFontCategories: (categories: FontCategory[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFontSize: (size: number) => void;
  setCustomText: (text: string) => void;
  setTextColor: (color: string) => void;
  setLineHeight: (height: number) => void;
  setLetterSpacing: (spacing: number) => void;
  // Selection actions
  selectFont: (font: Font, isShiftKey?: boolean, isCommandKey?: boolean) => void;
  selectAllFonts: () => void;
  deselectAllFonts: () => void;
  moveSelectedFonts: (category: string) => void;
  // Add bulk actions
  bulkUpdateTags: (tagsToAdd: string[], tagsToRemove: string[]) => void;
  bulkSetLanguage: (language: string) => void;
  exportSelectedFonts: (fontsToExport?: Font[]) => void;
  copySelectedFontNames: () => void;
  // New methods
  getFontDetails: (font: Font) => Promise<void>;
  getFontDetailsForAll: () => Promise<void>;
}

export const useFontStore = create<StoreState>((set, get) => {
  
  // Helper function for exporting multiple fonts as a ZIP
  const exportFontsAsZip = async (fontsToExport: Font[], zipName: string): Promise<void> => {
    // Create ZIP file
    const zip = new JSZip();
    console.log(`Creating ZIP file for ${fontsToExport.length} fonts: ${zipName}`);

    // Process fonts one by one (sequentially to avoid race conditions)
    for (const font of fontsToExport) {
      try {
        console.log(`Getting data for ${font.family} ${font.style}`);
        const fontData = await getFontData(font);
        
        if (fontData) {
          const type = getFontType(font);
          const fileName = `${font.family}-${font.style}.${type}`;
          zip.file(fileName, fontData);
          console.log(`Added to ZIP: ${fileName}`);
        } else {
          console.warn(`Skipping ${font.family} ${font.style} - no data available`);
        }
      } catch (err) {
        console.error(`Error processing ${font.family} ${font.style}:`, err);
        // Don't fail the entire export if one font fails
      }
    }
    
    // Generate ZIP file
    console.log('Generating ZIP file...');
    const zipBlob = await zip.generateAsync({ type: 'arraybuffer' });
    console.log(`ZIP generated, size: ${zipBlob.byteLength} bytes`);

    // Verify ZIP contents
    const zipEntries = Object.keys(zip.files);
    console.log(`ZIP contains ${zipEntries.length} files:`);
    zipEntries.forEach(entry => console.log(`- ${entry}`));

    // Save ZIP file using Electron
    // @ts-expect-error - Electron API
    const result = await window.electron.saveZipFile({
      name: zipName,
      data: zipBlob
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to save ZIP file');
    }
    
    console.log('ZIP file saved successfully');
  };

  return {
  fonts: [],
  fontCategories: [],
  loading: false,
  error: null,
  // Default values for font customization
  fontSize: 24,
  customText: '',
  textColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#FFFFFF' : '#000000',
  lineHeight: 100, // percentage
  letterSpacing: 0, // percentage
  // Selection state
  selectedFonts: new Set(),
  lastSelectedFont: null,
  // Add metadata storage
  fontMetadata: new Map(),
  fontFeatures: new Map(),
  // Actions
  setFonts: (fonts) => set({ fonts }),
  setFontCategories: (categories) => set({ fontCategories: categories }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFontSize: (fontSize) => set({ fontSize }),
  setCustomText: (customText) => set({ customText }),
  setTextColor: (textColor) => set({ textColor }),
  setLineHeight: (lineHeight) => set({ lineHeight }),
  setLetterSpacing: (letterSpacing) => set({ letterSpacing }),
  // Selection actions
  selectFont: (font, isShiftKey = false, isCommandKey = false) => {
      const { selectedFonts, lastSelectedFont, fonts, fontCategories } = get(); 
    const newSelected = new Set(selectedFonts);
    const fontId = font.postscriptName || font.fullName;
      const familyName = font.family;
      
      // Find all fonts belonging to the same family as the clicked font
      const familyFonts = fonts.filter(f => f.family === familyName);
      const familyFontIds = familyFonts.map(f => f.postscriptName || f.fullName);

    if (isShiftKey && lastSelectedFont) {
        // --- Corrected Shift-Select Logic --- 
        
        // Get a flat list of *all* fonts in the order they are displayed
        const allDisplayedFonts: Font[] = [];
      fontCategories.forEach(category => {
        category.families.forEach(family => {
            // Ensure fonts within a family are sorted consistently (e.g., by weight)
            const sortedFamilyFonts = family.fonts.sort((a, b) => {
              const weightMap: { [key: string]: number } = { thin: 100, extralight: 200, light: 300, regular: 400, normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 };
              const getWeight = (f: Font) => weightMap[f.style.toLowerCase().replace(/\s+/g, '')] || 400;
              return getWeight(a) - getWeight(b);
            });
            sortedFamilyFonts.forEach(f => allDisplayedFonts.push(f));
        });
      });

        // Find indices of the last selected *individual* font and the current *clicked* font
        const lastIndex = allDisplayedFonts.findIndex(f => (f.postscriptName || f.fullName) === lastSelectedFont);
        const currentIndex = allDisplayedFonts.findIndex(f => (f.postscriptName || f.fullName) === fontId);
      
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        
          // Select all fonts (individual weights) within the visual range
          newSelected.clear(); // Start fresh for range selection like Finder
        for (let i = start; i <= end; i++) {
            const fontInRange = allDisplayedFonts[i];
            // Add all weights of the family that the font in range belongs to
            const familyOfFontInRange = fonts.filter(f => f.family === fontInRange.family);
            familyOfFontInRange.forEach(f => newSelected.add(f.postscriptName || f.fullName));
        }
        } else {
          // Fallback if indices aren't found: select just the current family
          familyFontIds.forEach(id => newSelected.add(id));
      }
    } else if (isCommandKey) {
        // Cmd/Ctrl-click: Toggle selection state for the entire family
        const isFamilyAlreadySelected = familyFontIds.some(id => newSelected.has(id));
        
        if (isFamilyAlreadySelected) {
          familyFontIds.forEach(id => newSelected.delete(id));
        } else {
          familyFontIds.forEach(id => newSelected.add(id));
        }
      } else {
        // Single click: Deselect everything else and select the entire family
      newSelected.clear();
        familyFontIds.forEach(id => newSelected.add(id));
    }

    set({ 
      selectedFonts: newSelected,
        // Keep track of the specific font clicked
      lastSelectedFont: fontId
    });
  },
  selectAllFonts: () => {
    const { fonts } = get();
    const allFontIds = fonts.map(f => f.postscriptName || f.fullName);
    set({ 
      selectedFonts: new Set(allFontIds),
      lastSelectedFont: allFontIds[allFontIds.length - 1]
    });
  },
  deselectAllFonts: () => {
    set({ 
      selectedFonts: new Set(),
      lastSelectedFont: null
    });
  },
  moveSelectedFonts: (category) => {
    const { fonts, selectedFonts } = get();
    const updatedFonts = fonts.map(font => {
      const fontId = font.postscriptName || font.fullName;
      if (selectedFonts.has(fontId)) {
        // Start with existing tags or empty array
        let tags = [...(font.tags || [])];
        
        // If it's a manual move, we should allow removing from auto-categorized tags
        if (!tags.includes(category)) {
          tags.push(category);
        } else {
          // Remove the category if it already exists
          tags = tags.filter(tag => tag !== category);
        }
        
        return { ...font, tags };
      }
      return font;
    });
    set({ fonts: updatedFonts, fontCategories: categorizeFonts(updatedFonts) });
  },
    // New bulk update actions
    bulkUpdateTags: (tagsToAdd, tagsToRemove) => {
      const { fonts, selectedFonts } = get();
      const updatedFonts = fonts.map(font => {
        const fontId = font.postscriptName || font.fullName;
        if (selectedFonts.has(fontId)) {
          let tags = [...(font.tags || [])];
          // Remove tags
          tags = tags.filter(tag => !tagsToRemove.includes(tag));
          // Add tags (avoid duplicates)
          tagsToAdd.forEach(tag => {
            if (!tags.includes(tag)) {
              tags.push(tag);
            }
          });
          return { ...font, tags };
        }
        return font;
      });
      set({ fonts: updatedFonts, fontCategories: categorizeFonts(updatedFonts) });
    },
    bulkSetLanguage: (language) => {
      const { fonts, selectedFonts } = get();
      const updatedFonts = fonts.map(font => {
        const fontId = font.postscriptName || font.fullName;
        if (selectedFonts.has(fontId)) {
          return { ...font, language };
        }
        return font;
      });
      set({ fonts: updatedFonts, fontCategories: categorizeFonts(updatedFonts) });
    },
    exportSelectedFonts: async (fontsToExport?: Font[]) => {
    const { fonts, selectedFonts } = get();
      
      // Determine the list of fonts to export
      let actualFontsToExport: Font[];
      if (fontsToExport) {
        // If fonts are passed directly (e.g., from FontCard export action)
        actualFontsToExport = fontsToExport;
        console.log(`Export triggered with explicit list: ${actualFontsToExport.length} fonts`);
      } else {
        // If no list is passed, use the currently selected fonts
        actualFontsToExport = fonts.filter(font => 
      selectedFonts.has(font.postscriptName || font.fullName)
    );
        console.log(`Export triggered from selection: ${actualFontsToExport.length} fonts`);
      }

      if (actualFontsToExport.length === 0) {
        console.warn('No fonts to export.');
        return;
      }

      console.log(`Starting export of ${actualFontsToExport.length} fonts`);
      
      // Log selected fonts for debugging
      actualFontsToExport.forEach(font => {
        console.log(`> Exporting: ${font.family} ${font.style} (${font.postscriptName || font.fullName})`);
      });

      try {
        // Determine the number of unique families being exported
        const uniqueFamilies = new Set(actualFontsToExport.map(font => font.family));
        const isSingleFamilyExport = uniqueFamilies.size === 1;
        const fontFamilyName = isSingleFamilyExport ? actualFontsToExport[0].family : null;
        
        console.log(`Unique families to export: ${uniqueFamilies.size}`);
        
        if (actualFontsToExport.length === 1) {
          // Always export a single selected font as an individual file
          const font = actualFontsToExport[0];
          console.log(`Exporting single font file: ${font.family} ${font.style}`);
          
        const fontData = await getFontData(font);
        if (!fontData) {
            throw new Error(`Could not get font data for ${font.family} ${font.style}`);
        }

        // @ts-expect-error - Electron API
        const result = await window.electron.saveFontFile({
            name: `${font.family}-${font.style}`,
          data: fontData,
          type: getFontType(font)
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to save font file');
        }
          
          console.log(`Successfully exported ${font.family} ${font.style}`);
        } else if (isSingleFamilyExport) {
          // If exporting multiple weights of the same family, export as a zip named after the family
          console.log(`Exporting single family (${fontFamilyName}) with ${actualFontsToExport.length} weights as ZIP`);
          await exportFontsAsZip(actualFontsToExport, `${fontFamilyName}.zip`);
      } else {
          // If exporting multiple fonts from different families, export as "fonts.zip"
          console.log(`Exporting multiple families (${uniqueFamilies.size})`);
          await exportFontsAsZip(actualFontsToExport, 'fonts.zip');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to export fonts:', err);
        // @ts-expect-error - Electron API
        window.electron.showError('Failed to export fonts', err.message);
      }
    }
  },
  copySelectedFontNames: () => {
    const { fonts, selectedFonts } = get();
    const selectedFontNames = Array.from(new Set(
      fonts
        .filter(font => selectedFonts.has(font.postscriptName || font.fullName))
        .map(font => font.family)
    )).join('\n');
    navigator.clipboard.writeText(selectedFontNames);
  },
  // New method to get detailed font information
  getFontDetails: async (font: Font) => {
    try {
      const fontName = font.fullName || `${font.family} ${font.style}`;
      
      // @ts-expect-error - Electron API
      const result = await window.electron.getFontDetails(fontName);
      
      if (!result.success) {
        console.error('Failed to get font details:', result.error);
        return;
      }
      
      // Update store with the new information
      set(state => ({
        fontMetadata: new Map(state.fontMetadata).set(font.postscriptName || font.fullName, result.metadata),
        fontFeatures: new Map(state.fontFeatures).set(font.postscriptName || font.fullName, result.features)
      }));
    } catch (err) {
      console.error('Error getting font details:', err);
    }
  },
  
  // Get details for all fonts
  getFontDetailsForAll: async () => {
    try {
      // @ts-expect-error - Electron API
      const result = await window.electron.getAllFontDetails();
      
      if (!result.success) {
        console.error('Failed to get all font details:', result.error);
        return;
      }
      
      // Process and update metadata for all fonts
      const fontMetadata = new Map();
      const { fonts } = get();
      
      for (const font of fonts) {
        const identifier = font.postscriptName || font.fullName;
        const fontDetail = result.fonts.find((f: any) => 
          f.fullName === font.fullName || 
          f.postscriptName === font.postscriptName
        );
        
        if (fontDetail) {
          fontMetadata.set(identifier, fontDetail);
        }
      }
      
      set({ fontMetadata });
    } catch (err) {
      console.error('Error getting all font details:', err);
    }
  }
  }
});