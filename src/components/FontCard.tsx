import React, { useState, useRef, useEffect } from 'react';
import { Font } from '../types';
import { Tag, Globe } from 'lucide-react';
import { FontTagManager } from './FontTagManager';
import { useFontStore } from '../store';

const LANGUAGE_SAMPLES: Record<string, string> = {
  'Arabic': 'الحياة جميلة',
  'Chinese': '生活是美好的',
  'Japanese': '人生は美しい',
  'Korean': '인생은 아름다워',
  'Thai': 'ชีวิตสวยงาม',
  'Hebrew': 'החיים יפים',
  'Devanagari': 'जीवन सुंदर है',
  'English': 'The quick brown fox jumps over the lazy dog'
};

interface FontCardProps {
  fonts: Font[];
  familyName: string;
  category: string;
  allCategories: string[];
  onUpdateFont: (font: Font, newTags: string[], newLanguage: string) => void;
}

export const FontCard: React.FC<FontCardProps> = ({
  fonts,
  familyName,
  category,
  allCategories,
  onUpdateFont,
}) => {
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isLanguageManagerOpen, setIsLanguageManagerOpen] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState<string | null>(null);
  const tagManagerRef = useRef<HTMLDivElement>(null);
  const languageManagerRef = useRef<HTMLDivElement>(null);
  const { removeFont } = useFontStore();

  const mainFont = fonts[0];

  // Auto-set the language based on the category
  useEffect(() => {
    // Only proceed if we don't have a language set
    if (!mainFont.language) {
      // If the font is in a language category, use that language
      const matchingLanguage = Object.keys(LANGUAGE_SAMPLES).find(lang => 
        category.toLowerCase() === lang.toLowerCase()
      );
      
      // Only update if we found a matching language or if we need to set the default English
      const newLanguage = matchingLanguage || 'English';
      if (newLanguage !== mainFont.language) {
        onUpdateFont(mainFont, mainFont.tags || [], newLanguage);
      }
    }
  }, [category]); // Only depend on category changes

  const getSampleText = () => {
    const language = mainFont.language || 'English';
    return LANGUAGE_SAMPLES[language] || LANGUAGE_SAMPLES.English;
  };

  const formatWeight = (style: string) => {
    const weight = style.toLowerCase().includes('thin') ? 'Thin' :
                  style.toLowerCase().includes('extralight') ? 'Extra Light' :
                  style.toLowerCase().includes('light') ? 'Light' :
                  style.toLowerCase().includes('regular') ? 'Regular' :
                  style.toLowerCase().includes('medium') ? 'Medium' :
                  style.toLowerCase().includes('semibold') ? 'Semi Bold' :
                  style.toLowerCase().includes('bold') ? 'Bold' :
                  style.toLowerCase().includes('extrabold') ? 'Extra Bold' :
                  style.toLowerCase().includes('black') ? 'Black' :
                  style;

    return weight;
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
    return weightMap[formatWeight(style)] || '400';
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagManagerRef.current && !tagManagerRef.current.contains(event.target as Node)) {
        setIsTagManagerOpen(false);
      }
      if (languageManagerRef.current && !languageManagerRef.current.contains(event.target as Node)) {
        setIsLanguageManagerOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{familyName}</h3>
      </div>
      
      <div className="flex gap-2 mb-4">
        <div className="relative" ref={tagManagerRef}>
          <button
            onClick={() => setIsTagManagerOpen(!isTagManagerOpen)}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <Tag size={12} />
            {mainFont.tags?.length ? mainFont.tags.join(', ') : 'Add tags...'}
          </button>
          
          {isTagManagerOpen && (
            <div className="absolute z-10 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 animate-fadeIn">
              <FontTagManager
                font={mainFont}
                allCategories={allCategories}
                onUpdateTags={(font, newTags) => {
                  onUpdateFont(font, newTags, font.language || 'English');
                  setIsTagManagerOpen(false);
                }}
              />
            </div>
          )}
        </div>

        <div className="relative" ref={languageManagerRef}>
          <button
            onClick={() => setIsLanguageManagerOpen(!isLanguageManagerOpen)}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <Globe size={12} />
            {mainFont.language || 'Set language...'}
          </button>
          
          {isLanguageManagerOpen && (
            <div className="absolute z-10 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 animate-fadeIn">
              <div className="p-2 space-y-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Select Language</div>
                {Object.keys(LANGUAGE_SAMPLES).map((language) => (
                  <button
                    key={language}
                    onClick={() => {
                      onUpdateFont(mainFont, mainFont.tags || [], language);
                      setIsLanguageManagerOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 focus:bg-blue-50 dark:focus:bg-gray-700 focus:outline-none"
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p 
          className="text-lg text-gray-900 dark:text-white"
          style={{ 
            fontFamily: familyName,
            fontWeight: selectedWeight ? getFontWeight(selectedWeight) : 'normal'
          }}
        >
          {getSampleText()}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {fonts.map((font) => {
          const weight = formatWeight(font.style);
          const isSelected = selectedWeight === font.style;
          return (
            <button
              key={font.fullName}
              onClick={() => setSelectedWeight(isSelected ? null : font.style)}
              className={`px-2 py-1 text-xs rounded transition-colors duration-200 ${
                isSelected 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {weight}
            </button>
          );
        })}
      </div>
    </div>
  );
};