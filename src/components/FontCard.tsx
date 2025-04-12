import React from 'react';
import { Font } from '../types';
import { Tag } from 'lucide-react';
import { FontTagManager } from './FontTagManager';

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900">{familyName}</h3>
        <FontTagManager
          font={mainFont}
          allCategories={allCategories}
          onUpdateTags={(font, newTags) => onUpdateFont(font, newTags)}
        />
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