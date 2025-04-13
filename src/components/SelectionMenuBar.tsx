import React, { useState, useMemo, useRef } from 'react';
import { Move, Download, Copy, Tag, Globe, ChevronDown } from 'lucide-react';
import { useFontStore } from '../store';
import { FontTagManager } from './FontTagManager';
import { Font } from '../types';

// Define useClickOutside hook locally if not imported from a shared location
const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

// Define LANGUAGE_SAMPLES locally (consider moving to a shared constants file)
const LANGUAGE_SAMPLES: Record<string, string> = {
  'English': 'The quick brown fox jumps over the lazy dog.',
  'Spanish': 'El veloz murciélago hindú comía feliz cardillo y kiwi.',
  // ... Add all other languages ...
  'French': 'Portez ce vieux whisky au juge blond qui fume.',
  'German': 'Falsches Üben von Xylophonmusik quält jeden größeren Zwerg.',
  'Italian': "Pranzo d'acqua fa volti sghembi.",
  'Portuguese': 'Vexame de Júlio: a fábrica de quixotes zomba do seu rápido crescimento.',
  'Russian': 'Съешь же ещё этих мягких французских булок, да выпей чаю.',
  'Chinese': '天地玄黄，宇宙洪荒，日月盈仄，辰宿列张.',
  'Japanese': 'いろはにほへとちりぬるを わかよたれそ つねならむ.',
  'Korean': '키스의 고유조건은 입술끼리 만나야 한다.',
  'Arabic': 'صِفْ خَلْفَ جِبَالِ عُرُوزَ قَدِيمَةٍ يَزْدَادُ رَوْعُهَا بِكُلِّ حُرُوفِ اللُّغَةِ.',
  'Hebrew': 'דג סקרן שט בים מאוכזב ולפתע מצא חברה.',
  'Hindi': 'सरल ज्ञान से झिलमिलाता है अद्भुत फन, क़लम का ज़ोर बिखेरता है उत्साह.',
  'Thai': 'เป็นมนุษย์สุดประเสริฐเลิศคุณค่า กว่าบรรดาฟ้าแดนสวรรค์.',
  'Devanagari': 'निरन्तरान्धकारिता-दिगन्तर-कन्दलदमन्द-सुधारस-बिन्दु-सान्द्रतर-घनाघन-वृन्द-सन्देहकर-स्यन्दमान-मकरन्द-बिन्दु-बन्धुरतर-माकन्द-तरु-कुल-تلف-कल्प-मृदुल-सिकता-जाल-जटिल-मूल-तल-मरुवक-मिलदलघु-लघु-लय-कलित-रमणीय-पानीय-शालिका-बालिका-करार-विन्द-गलन्तिका-गलदेला-लवङ्ग-पाटल-घनसार-कस्तूरिकातिसौरभ-मेदुर-लघुतर-मधुर-शीतलतर-सलिलधारा-निराकरिष्णु-तदीय-विमल-विलोचन-मयूख-रेखापसारित-पिपासायास-पथिक-लोकान्.'
};

interface SelectionMenuBarProps {
  // categories prop is no longer needed as FontTagManager gets allCategories
  allCategories: string[];
}

export const SelectionMenuBar: React.FC<SelectionMenuBarProps> = ({ allCategories }) => {
  const [showTagManager, setShowTagManager] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const tagManagerRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  
  const { 
    selectedFonts, 
    // moveSelectedFonts, // Not used directly here anymore
    exportSelectedFonts, 
    copySelectedFontNames,
    fonts,
    bulkUpdateTags,
    bulkSetLanguage 
  } = useFontStore();

  useClickOutside(tagManagerRef, () => setShowTagManager(false));
  useClickOutside(languageMenuRef, () => setShowLanguageMenu(false));

  // Calculate selected unique font families
  const selectedFamilies = useMemo(() => {
    if (selectedFonts.size === 0) return new Set<string>();
    const familyNames = new Set<string>();
    fonts.forEach(font => {
      if (selectedFonts.has(font.postscriptName || font.fullName)) {
        familyNames.add(font.family);
      }
    });
    return familyNames;
  }, [selectedFonts, fonts]);

  const selectedFamiliesCount = selectedFamilies.size;

  // Get the first selected font to pass context to FontTagManager
  const firstSelectedFont = useMemo(() => {
  if (selectedFonts.size === 0) return null;
    const firstSelectedId = Array.from(selectedFonts)[0]; // Get first ID from set
    return fonts.find(f => (f.postscriptName || f.fullName) === firstSelectedId) || null;
  }, [selectedFonts, fonts]);

  // Handler for FontTagManager updates (uses bulk action)
  const handleBulkTagUpdate = (fontContext: Font, newTags: string[]) => {
    // fontContext is just used for tag comparison, bulkUpdateTags works on selection
    const currentTags = fontContext.tags || [];
    const tagsToAdd = newTags.filter(tag => !currentTags.includes(tag));
    const tagsToRemove = currentTags.filter(tag => !newTags.includes(tag));
    bulkUpdateTags(tagsToAdd, tagsToRemove);
    setShowTagManager(false); // Close manager after update
  };

  // Handler for Language selection (uses bulk action)
  const handleLanguageSelect = (language: string) => {
    bulkSetLanguage(language);
    setShowLanguageMenu(false);
  };

  // Only show when 2 or more families are selected
  if (selectedFamiliesCount <= 1) return null;

  return (
    <div className="w-full mx-auto mt-4 mb-8 flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg animate-fadeIn">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-0">
        {selectedFamiliesCount} {selectedFamiliesCount === 1 ? 'family' : 'families'} selected 
        <span className="text-xs ml-1 opacity-60">({selectedFonts.size} weights)</span>
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto flex-wrap sm:flex-nowrap">
        {/* Tag Manager Button & Popover - Render only if a font context exists */}
        {firstSelectedFont && (
          <div className="relative flex-grow sm:flex-grow-0" ref={tagManagerRef}>
            <button
              onClick={() => setShowTagManager(!showTagManager)}
              className="w-full sm:w-auto flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <Tag size={16} />
              <span>Tags</span>
            </button>
            
            {showTagManager && (
              <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 animate-fadeIn" style={{ right: 0 }}> {/* Position right */}
                <FontTagManager
                  font={firstSelectedFont} // Pass first selected font for context
                  allCategories={allCategories} // Pass all categories
                  onUpdateTags={handleBulkTagUpdate} // Use bulk update handler
                />
              </div>
            )}
          </div>
        )}

        {/* Language Selector Button & Popover */}
        <div className="relative flex-grow sm:flex-grow-0" ref={languageMenuRef}>
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="w-full sm:w-auto flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <Globe size={16} />
            {/* Consider showing "Multiple" if languages differ? */}
            <span>Language</span> 
            <ChevronDown size={14} className="ml-1 opacity-50" />
          </button>
          
          {showLanguageMenu && (
            <div className="absolute z-20 mt-1 right-0 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 animate-fadeIn max-h-60 overflow-y-auto">
              <div className="p-2 space-y-2">
                 <div className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-t-md -mt-0.5 -mx-0.5 text-xs font-medium text-gray-500 dark:text-gray-300">Select Language</div>
                 <div className="max-h-60 overflow-y-auto pr-1 space-y-0.5">
                    {Object.keys(LANGUAGE_SAMPLES).map((lang) => (
                  <button
                        key={lang}
                        onClick={() => handleLanguageSelect(lang)}
                        className="w-full text-left px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-600 focus:bg-blue-50 dark:focus:bg-gray-600 focus:outline-none rounded"
                  >
                        {lang}
                  </button>
                ))}
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Copy Names Button */}
        <button
          onClick={copySelectedFontNames}
          className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <Copy size={16} />
          <span>Copy Names</span>
        </button>

        {/* Export Button */}
        <button
          onClick={() => exportSelectedFonts()}
          className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <Download size={16} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}; 