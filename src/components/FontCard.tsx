import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Font } from '../types';
import { Globe, MoreVertical, Copy, FolderInput, Info, Move, Download, AppWindow, ChevronDown, Layers, Folder } from 'lucide-react';
import { FontTagManager } from './FontTagManager';
import { useFontStore } from '../store';
import { FontCollectionManager } from './FontCollectionManager';

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
  useEffect(() => {
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

const LANGUAGE_SAMPLES: Record<string, string> = {
  'English': 'The quick brown fox jumps over the lazy dog.',
  'Spanish': 'El veloz murciélago hindú comía feliz cardillo y kiwi.',
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
  'Devanagari': 'कलम से लिखी कहानी, शब्दों का जादू छाया है।'
};

interface FontCardProps {
  fonts: Font[];
  familyName: string;
  category: string;
  allCategories: string[];
  onUpdateFont: (font: Font, newCollections: string[], newLanguage: string) => void;
  viewMode?: 'grid' | 'stack';
  onShowDetails: () => void;
}

export function FontCard({ fonts, familyName, category, allCategories, onUpdateFont, viewMode = 'grid', onShowDetails }: FontCardProps) {
  const { 
    fontSize, 
    customText, 
    textColor,
    lineHeight,
    letterSpacing,
    selectedFonts,
    selectFont,
    exportSelectedFonts,
  } = useFontStore();

  const [isHovered, setIsHovered] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isLanguageManagerOpen, setIsLanguageManagerOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeFont, setActiveFont] = useState<Font | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const tagManagerRef = useRef<HTMLDivElement>(null);
  const languageManagerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [showCollectionManager, setShowCollectionManager] = useState<string | null>(null);
  const collectionManagerRef = useRef<HTMLDivElement>(null);

  const sortedFonts = useMemo(() => {
    const weightMap: { [key: string]: number } = {
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

    const getWeight = (font: Font) => {
      const style = font.style.toLowerCase();
      for (const [name, weight] of Object.entries(weightMap)) {
        if (style.includes(name)) return weight;
      }
      return 400;
    };

    return [...fonts].sort((a, b) => getWeight(a) - getWeight(b));
  }, [fonts]);

  const defaultFont = useMemo(() => sortedFonts[0], [sortedFonts]);

  const isSelected = useCallback((font: Font) => {
    return selectedFonts.has(font.postscriptName || font.fullName);
  }, [selectedFonts]);

  const handleCopyName = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(familyName);
    setIsDropdownOpen(false);
  }, [familyName]);

  const handleExport = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const familyFontsToExport = fonts;
    console.log(`Exporting all ${familyFontsToExport.length} weights for family: ${familyName} from card action`);
    exportSelectedFonts(familyFontsToExport);
    setIsDropdownOpen(false);
  }, [fonts, familyName, exportSelectedFonts]);

  const handleInfoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onShowDetails();
    setIsDropdownOpen(false);
  }, [onShowDetails]);

  useEffect(() => {
    if (fonts.length > 0 && !fonts[0].language) {
      const matchingLanguage = Object.keys(LANGUAGE_SAMPLES).find(lang => 
        category.toLowerCase() === lang.toLowerCase()
      );
      
      const newLanguage = matchingLanguage || 'English';
      if (newLanguage !== fonts[0].language) {
        onUpdateFont(fonts[0], fonts[0].tags || [], newLanguage);
      }
    }
  }, [category, fonts, onUpdateFont]);

  const getSampleText = () => {
    const language = fonts.length > 0 ? fonts[0].language || 'English' : 'English';
    return LANGUAGE_SAMPLES[language] || LANGUAGE_SAMPLES.English;
  };

  const getFontWeight = (style: string) => {
    const weightMap: Record<string, string> = {
      'Thin': '100',
      'Extra Light': '200',
      'Light': '300',
      'Regular': '400',
      'Medium': '500',
      'Semi Bold': '600',
      'Bold': '700',
      'Extra Bold': '800',
      'Black': '900'
    };

    const weight = style.toLowerCase();
    if (weight.includes('thin')) return '100';
    if (weight.includes('extralight')) return '200';
    if (weight.includes('light')) return '300';
    if (weight.includes('regular') || weight.includes('normal')) return '400';
    if (weight.includes('medium')) return '500';
    if (weight.includes('semibold')) return '600';
    if (weight.includes('bold') && !weight.includes('extra')) return '700';
    if (weight.includes('extrabold')) return '800';
    if (weight.includes('black')) return '900';
    return '400';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useClickOutside(tagManagerRef, () => setIsTagManagerOpen(false));
  useClickOutside(languageManagerRef, () => setIsLanguageManagerOpen(false));
  useClickOutside(collectionManagerRef, () => setShowCollectionManager(null));

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, a, .no-drag')) return;
    e.preventDefault();
    if (fonts.length > 0) {
      selectFont(fonts[0], e.shiftKey, e.metaKey || e.ctrlKey);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    
    if (fonts.length > 0 && !isSelected(fonts[0])) {
      selectFont(fonts[0], false, false);
    }

    if (fonts.length > 0) {
      e.dataTransfer.setData('text/plain', fonts[0].postscriptName || fonts[0].fullName);
      e.dataTransfer.effectAllowed = 'move';
    }

    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const dragImage = cardRef.current.cloneNode(true) as HTMLElement;
      dragImage.style.width = `${rect.width}px`;
      dragImage.style.opacity = '0.7';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, rect.width / 2, rect.height / 2);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    setActiveFont(null);
  }, [fonts]);

  const handleWeightClick = useCallback((e: React.MouseEvent, font: Font) => {
    e.stopPropagation();
    setActiveFont((prevFont: Font | null) => (prevFont === font ? null : font));
  }, []);

  const handleUpdateCollection = (font: Font, newCollections: string[]) => {
    onUpdateFont(font, newCollections, font.language || '');
    setShowCollectionManager(null);
  };

  const DropdownMenu = () => {
    return (
      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 animate-fadeIn z-10">
        <div className="py-1">
          <button
            onClick={handleInfoClick}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none flex items-center gap-2"
          >
            <Info size={16} />
            Font Info
          </button>
          
          <button
            onClick={handleCopyName}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none flex items-center gap-2"
          >
            <Copy size={16} />
            Copy Name
          </button>
          
          <button
            onClick={handleExport}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none flex items-center gap-2"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={cardRef}
      data-font-family={familyName}
      data-font-id={activeFont?.postscriptName || activeFont?.fullName}
      className={`font-card group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ${
        viewMode === 'grid' ? 'p-6 w-full h-full flex flex-col' : 
        'p-4 w-full flex flex-col'
      } ${
        fonts.some(f => selectedFonts.has(f.postscriptName || f.fullName)) ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-inset' : ''
      } ${isDragging ? 'opacity-50' : ''} cursor-pointer`}
      onClick={handleCardClick}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onShowDetails();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setIsDropdownOpen(true);
      }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex justify-between items-start mb-4 gap-2 min-w-0 w-full`}>
        <h3 
          className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate flex-1 min-w-0"
          style={{
            fontFamily: activeFont || defaultFont ? (activeFont || defaultFont).postscriptName || (activeFont || defaultFont).family : 'inherit',
            fontWeight: getFontWeight((activeFont || defaultFont)?.style || 'regular'),
            fontStyle: (activeFont || defaultFont)?.style.toLowerCase().includes('italic') ? 'italic' : 'normal',
            fontFamily: defaultFont.postscriptName || defaultFont.family,
            fontWeight: getFontWeight(defaultFont.style),
            fontStyle: defaultFont.style.toLowerCase().includes('italic') ? 'italic' : 'normal',
          }}
        >
          {familyName}
        </h3>
        <div className="relative no-drag flex-shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MoreVertical size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
          {isDropdownOpen && (
            <DropdownMenu />
          )}
        </div>
      </div>
      
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative no-drag" ref={tagManagerRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsTagManagerOpen(!isTagManagerOpen);
            }}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 max-w-full truncate"
          >
            <Folder size={12} className="flex-shrink-0" />
            <span className="truncate">{fonts[0].tags?.length ? fonts[0].tags.join(', ') : 'Add to collections...'}</span>
          </button>
          
          {isTagManagerOpen && fonts.length > 0 && (
            <div className="fixed z-20 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 animate-fadeIn" style={{ top: tagManagerRef.current?.getBoundingClientRect().bottom, left: tagManagerRef.current?.getBoundingClientRect().left }}>
              <FontCollectionManager
                font={fonts[0]}
                allCategories={allCategories.filter(cat => !Object.keys(LANGUAGE_SAMPLES).includes(cat))}
                onUpdateCollection={(font, newCollections) => {
                  const currentTags = fonts[0].tags || [];
                  const addedCollection = newCollections.find(collection => !currentTags.includes(collection));
                  const updatedAllCategories = addedCollection && !allCategories.includes(addedCollection)
                    ? [...allCategories, addedCollection]
                    : allCategories;
                  
                  onUpdateFont(font, newCollections, font.language || 'English');
                  
                  if (addedCollection && !allCategories.includes(addedCollection)) {
                    // Re-categorization logic might be needed here or in App.tsx
                  }

                  setIsTagManagerOpen(false);
                }}
              />
            </div>
          )}
        </div>

        <div className="relative no-drag" ref={languageManagerRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLanguageManagerOpen(!isLanguageManagerOpen);
            }}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 max-w-full truncate"
          >
            <Globe size={12} className="flex-shrink-0" />
            <span className="truncate">{fonts[0].language || 'Set language...'}</span>
          </button>
          
          {isLanguageManagerOpen && (
            <div className="fixed z-20 mt-1 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 animate-fadeIn" style={{ top: languageManagerRef.current?.getBoundingClientRect().bottom, left: languageManagerRef.current?.getBoundingClientRect().left }}>
              <div className="p-2 space-y-2">
                <div className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded-t-md -mt-0.5 -mx-0.5 text-xs font-medium text-gray-500 dark:text-gray-300">Select Language</div>
                <div className="max-h-64 overflow-y-auto pr-1 space-y-0.5">
                  {Object.keys(LANGUAGE_SAMPLES).map((language) => (
                    <button
                      key={language}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateFont(fonts[0], fonts[0].tags || [], language);
                        setIsLanguageManagerOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-600 focus:bg-blue-50 dark:focus:bg-gray-600 focus:outline-none rounded"
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`flex-1 min-w-0 flex flex-col`}>
        <div 
          className={`mb-4 flex-1`}
          style={{ 
            fontFamily: (activeFont || defaultFont).postscriptName || (activeFont || defaultFont).family, 
            fontSize: `${fontSize}px`,
            lineHeight: `${lineHeight}%`,
            letterSpacing: `${letterSpacing * 0.1}em`,
            color: textColor,
            wordWrap: 'break-word',
            overflow: 'hidden',
            fontStyle: (activeFont || defaultFont).style.toLowerCase().includes('italic') ? 'italic' : 'normal',
            fontWeight: getFontWeight((activeFont || defaultFont).style)
          }}
        >
          {customText || getSampleText()}
        </div>

        <div className={`flex flex-wrap gap-1.5`}>
          {sortedFonts.map((font) => (
            <button
              key={font.postscriptName || font.fullName}
              className={`px-2 py-1 text-xs rounded-md border ${
                activeFont === font
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              } transition-colors no-drag`}
              onClick={(e) => handleWeightClick(e, font)}
              style={{
                fontFamily: font.family,
                fontStyle: font.style.toLowerCase().includes('italic') ? 'italic' : 'normal',
                fontWeight: getFontWeight(font.style)
              }}
            >
              {font.style}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}