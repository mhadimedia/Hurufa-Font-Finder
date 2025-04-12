import React, { useState, useRef, useEffect } from 'react';
import { Font } from '../types';
import { Tag, X } from 'lucide-react';
import { FontTagManager } from './FontTagManager';
import { useStore } from '../store';

const LANGUAGE_SAMPLES: Record<string, string> = {
  'ARABIC': 'الحياة جميلة',
  'CHINESE': '生活是美好的',
  'JAPANESE': '人生は美しい',
  'KOREAN': '인생은 아름다워',
  'THAI': 'ชีวิตสวยงาม',
  'HEBREW': 'החיים יפים',
  'DEVANAGARI': 'जीवन सुंदर है',
};

interface FontCardProps {
  fonts: Font[];
  familyName: string;
  category: string;
  allCategories: string[];
  onUpdateFont: (font: Font, newTags: string[]) => void;
}

export const FontCard: React.FC<FontCardProps> = ({
  fonts,
  familyName,
  category,
  allCategories,
  onUpdateFont,
}) => {
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const tagManagerRef = useRef<HTMLDivElement>(null);
  const { removeFont } = useStore();

  const mainFont = fonts[0];

  const isLanguageFont = Object.keys(LANGUAGE_SAMPLES).some(lang => 
    category.toUpperCase().includes(lang)
  );

  const getSampleText = () => {
    if (isLanguageFont) {
      const language = Object.keys(LANGUAGE_SAMPLES).find(lang => 
        category.toUpperCase().includes(lang)
      );
      return language ? LANGUAGE_SAMPLES[language] : 'The quick brown fox jumps over the lazy dog';
    }
    return 'The quick brown fox jumps over the lazy dog';
  };

  const formatWeight = (style: string) => {
    // Extract weight from style name
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagManagerRef.current && !tagManagerRef.current.contains(event.target as Node)) {
        setIsTagManagerOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900 truncate">{familyName}</h3>
        <button
          onClick={() => removeFont(familyName)}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-red-500"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="relative" ref={tagManagerRef}>
        <button
          onClick={() => setIsTagManagerOpen(!isTagManagerOpen)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
        >
          <Tag size={12} />
          {allCategories.length > 0 ? allCategories.join(', ') : 'Add tags...'}
        </button>
        
        {isTagManagerOpen && (
          <div className="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 animate-fadeIn">
            <FontTagManager
              font={mainFont}
              allCategories={allCategories}
              onUpdateTags={(font, newTags) => onUpdateFont(font, newTags)}
            />
          </div>
        )}
      </div>

      <div className="mb-4">
        <p 
          className="text-lg"
          style={{ fontFamily: familyName }}
        >
          {getSampleText()}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {fonts.map((font) => (
          <div
            key={font.fullName}
            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
          >
            {formatWeight(font.style)}
          </div>
        ))}
      </div>
    </div>
  );
};