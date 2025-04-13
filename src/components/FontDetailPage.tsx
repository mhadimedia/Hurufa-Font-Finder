import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FontFamily, FontInfo } from '../types';
import { X, Copy, Download, Info, ExternalLink, Star, StarHalf, Edit, Check } from 'lucide-react';
import { useFontStore } from '../store';

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

type TabName = 'Preview' | 'Waterfall' | 'Glyphs' | 'Information';

interface FontDetailPageProps {
  family: FontFamily;
  onClose: () => void;
}

// Language samples (pangrams) for preview
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
  'Devanagari': 'निरन्तरान्धकारिता-दिगन्तर-कन्दलदमन्द-सुधारस-बिन्दु-सान्द्रतर-घनाघन-वृन्द-सन्देहकर-स्यन्दमान-मकरन्द-बिन्दु-बन्धुरतर-माकन्द-तरु-कुल-तल्प-कल्प-मृदुल-सिकता-जाल-जटिल-मूल-तल-मरुवक-मिलदलघु-लघु-लय-कलित-रमणीय-पानीय-शालिका-बालिका-करार-विन्द-गलन्तिका-गलदेला-लवङ्ग-पाटल-घनसार-कस्तूरिकातिसौरभ-मेदुर-लघुतर-मधुर-शीतलतर-सलिलधारा-निराकरिष्णु-तदीय-विमल-विलोचन-मयूख-रेखापसारित-पिपासायास-पथिक-लोकान्.'
};

// Generate character sets for different scripts
const generateCharacterSets = () => {
  const latin = {
    uppercase: Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), // A-Z
    lowercase: Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)), // a-z
    numbers: Array.from({ length: 10 }, (_, i) => String.fromCharCode(48 + i)), // 0-9
    punctuation: ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=', '+', '[', ']', '{', '}', '|', ';', ':', "'", '"', ',', '.', '<', '>', '/', '?']
  };
  
  const cyrillic = {
    uppercase: Array.from({ length: 33 }, (_, i) => String.fromCharCode(1040 + i)), // А-Я
    lowercase: Array.from({ length: 33 }, (_, i) => String.fromCharCode(1072 + i)), // а-я
    extras: ['Ё', 'ё', 'Ђ', 'ђ', 'Љ', 'љ', 'Њ', 'њ', 'Ћ', 'ћ', 'Џ', 'џ']
  };

  const greek = {
    uppercase: Array.from({ length: 24 }, (_, i) => String.fromCharCode(913 + i)), // Α-Ω
    lowercase: Array.from({ length: 24 }, (_, i) => String.fromCharCode(945 + i)) // α-ω
  };
  
  const hebrew = Array.from({ length: 27 }, (_, i) => String.fromCharCode(1488 + i)); // א-ת
  const arabic = Array.from({ length: 36 }, (_, i) => String.fromCharCode(1570 + i)); // ؈-ۿ
  const devanagari = Array.from({ length: 128 }, (_, i) => String.fromCharCode(2304 + i)); // various Devanagari
  
  return { latin, cyrillic, greek, hebrew, arabic, devanagari };
};

export function FontDetailPage({ family, onClose }: FontDetailPageProps) {
  const { 
    fontSize, 
    customText, 
    textColor, 
    lineHeight, 
    letterSpacing, 
    copySelectedFontNames, 
    exportSelectedFonts, 
    selectFont 
  } = useFontStore();
  
  const [activeTab, setActiveTab] = useState<TabName>('Preview');
  const [fontSizeScale, setFontSizeScale] = useState<number>(1);
  const [description, setDescription] = useState<string>(family.description || '');
  const [customUrl, setCustomUrl] = useState<string>(family.customUrl || '');
  const [rating, setRating] = useState<number>(family.rating || 0);
  
  const characterSets = useMemo(() => generateCharacterSets(), []);

  // Get the appropriate character set based on language
  const getLanguageCharSet = (language: string) => {
    if (language === 'Russian') return 'cyrillic';
    if (language === 'Greek') return 'greek';
    if (language === 'Hebrew') return 'hebrew';
    if (language === 'Arabic') return 'arabic';
    if (language === 'Hindi' || language === 'Devanagari') return 'devanagari';
    return 'latin'; // Default to Latin
  };

  // Get sample text based on language
  const getSampleText = () => {
    const language = family.language || 'English';
    return customText || LANGUAGE_SAMPLES[language] || LANGUAGE_SAMPLES.English;
  };

  // Tab content rendering
  const renderPreview = () => {
    return (
      <div className="p-6 space-y-8">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Preview</h3>

        {/* Show custom text using each font style */}
        <div className="space-y-10">
          {family.fonts.map((font) => (
            <div key={font.postscriptName || font.fullName} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{font.style}</h4>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => navigator.clipboard.writeText(font.postscriptName || font.fullName)}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    title="Copy font name"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div 
                className="py-4 border-t border-b border-gray-200 dark:border-gray-700"
                style={{ 
                  fontFamily: font.postscriptName || font.family,
                  fontSize: `${fontSize}px`,
                  lineHeight: `${lineHeight}%`,
                  letterSpacing: `${letterSpacing * 0.1}em`,
                  color: textColor,
                  fontStyle: font.style.toLowerCase().includes('italic') ? 'italic' : 'normal',
                  fontWeight: font.style.toLowerCase().includes('bold') ? 'bold' : 
                             font.style.toLowerCase().includes('black') ? '900' :
                             font.style.toLowerCase().includes('semibold') ? '600' :
                             font.style.toLowerCase().includes('medium') ? '500' :
                             font.style.toLowerCase().includes('light') ? '300' :
                             font.style.toLowerCase().includes('thin') ? '100' : 'normal',
                }}
              >
                {getSampleText()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWaterfall = () => {
    // Default font is the Regular version if available, otherwise the first font
    const defaultFont = family.fonts.find(f => f.style.toLowerCase().includes('regular')) || family.fonts[0];
    
    // Font sizes for waterfall effect
    const sizes = [8, 10, 12, 14, 16, 18, 20, 24, 32, 36, 48, 64, 72, 96];
    
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Waterfall</h3>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setFontSizeScale(Math.max(0.5, fontSizeScale - 0.1))}
              className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              -
            </button>
            <div className="w-24 h-1 bg-gray-200 dark:bg-gray-600 rounded-full">
              <div 
                className="h-1 bg-blue-500 rounded-full" 
                style={{ width: `${(fontSizeScale - 0.5) / 1.5 * 100}%` }} 
              />
            </div>
            <button 
              onClick={() => setFontSizeScale(Math.min(2, fontSizeScale + 0.1))}
              className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              +
            </button>
          </div>
        </div>
        
        <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          {sizes.map(size => (
            <div key={size} className="flex items-center">
              <div className="w-12 text-xs text-gray-500 dark:text-gray-400">{size}px</div>
              <div 
                className="flex-1"
                style={{ 
                  fontFamily: defaultFont.postscriptName || defaultFont.family,
                  fontSize: `${size * fontSizeScale}px`,
                  fontStyle: defaultFont.style.toLowerCase().includes('italic') ? 'italic' : 'normal',
                  fontWeight: defaultFont.style.toLowerCase().includes('bold') ? 'bold' : 'normal',
                  color: textColor,
                  lineHeight: `${lineHeight}%`,
                  letterSpacing: `${letterSpacing * 0.1}em`,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {getSampleText().split(' ').slice(0, 3).join(' ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGlyphs = () => {
    // Default font is the Regular version if available, otherwise the first font
    const defaultFont = family.fonts.find(f => f.style.toLowerCase().includes('regular')) || family.fonts[0];
    const language = family.language || 'English';
    const charSetType = getLanguageCharSet(language);
    
    return (
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-6">Glyphs</h3>
        
        <div className="space-y-8">
          {/* Display script based on language */}
          {charSetType === 'latin' && (
            <>
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Latin</h4>
                <div className="grid grid-cols-12 gap-1 border rounded-md overflow-hidden">
                  {characterSets.latin.uppercase.map(char => (
                    <div 
                      key={char} 
                      className="aspect-square flex items-center justify-center text-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                      style={{ 
                        fontFamily: defaultFont.postscriptName || defaultFont.family 
                      }}
                    >
                      {char}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-12 gap-1 border rounded-md overflow-hidden mt-1">
                  {characterSets.latin.lowercase.map(char => (
                    <div 
                      key={char} 
                      className="aspect-square flex items-center justify-center text-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                      style={{ 
                        fontFamily: defaultFont.postscriptName || defaultFont.family 
                      }}
                    >
                      {char}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Numbers & Punctuation</h4>
                <div className="grid grid-cols-12 gap-1 border rounded-md overflow-hidden">
                  {characterSets.latin.numbers.map(char => (
                    <div 
                      key={char} 
                      className="aspect-square flex items-center justify-center text-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                      style={{ 
                        fontFamily: defaultFont.postscriptName || defaultFont.family 
                      }}
                    >
                      {char}
                    </div>
                  ))}
                  {characterSets.latin.punctuation.slice(0, 26).map(char => (
                    <div 
                      key={char} 
                      className="aspect-square flex items-center justify-center text-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                      style={{ 
                        fontFamily: defaultFont.postscriptName || defaultFont.family 
                      }}
                    >
                      {char}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {charSetType === 'cyrillic' && (
            <>
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Cyrillic</h4>
                <div className="grid grid-cols-12 gap-1 border rounded-md overflow-hidden">
                  {characterSets.cyrillic.uppercase.map(char => (
                    <div 
                      key={char} 
                      className="aspect-square flex items-center justify-center text-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                      style={{ 
                        fontFamily: defaultFont.postscriptName || defaultFont.family 
                      }}
                    >
                      {char}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-12 gap-1 border rounded-md overflow-hidden mt-1">
                  {characterSets.cyrillic.lowercase.map(char => (
                    <div 
                      key={char} 
                      className="aspect-square flex items-center justify-center text-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                      style={{ 
                        fontFamily: defaultFont.postscriptName || defaultFont.family 
                      }}
                    >
                      {char}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {(charSetType === 'hebrew' || charSetType === 'arabic' || charSetType === 'devanagari' || charSetType === 'greek') && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{language} Characters</h4>
              <div className="grid grid-cols-12 gap-1 border rounded-md overflow-hidden">
                {charSetType === 'hebrew' && characterSets.hebrew.map(char => (
                  <div 
                    key={char} 
                    className="aspect-square flex items-center justify-center text-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                    style={{ 
                      fontFamily: defaultFont.postscriptName || defaultFont.family 
                    }}
                  >
                    {char}
                  </div>
                ))}
                {charSetType === 'arabic' && characterSets.arabic.map(char => (
                  <div 
                    key={char} 
                    className="aspect-square flex items-center justify-center text-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                    style={{ 
                      fontFamily: defaultFont.postscriptName || defaultFont.family 
                    }}
                  >
                    {char}
                  </div>
                ))}
                {charSetType === 'devanagari' && characterSets.devanagari.slice(0, 48).map(char => (
                  <div 
                    key={char} 
                    className="aspect-square flex items-center justify-center text-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                    style={{ 
                      fontFamily: defaultFont.postscriptName || defaultFont.family 
                    }}
                  >
                    {char}
                  </div>
                ))}
                {charSetType === 'greek' && (
                  <>
                    {characterSets.greek.uppercase.map(char => (
                      <div 
                        key={char} 
                        className="aspect-square flex items-center justify-center text-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                        style={{ 
                          fontFamily: defaultFont.postscriptName || defaultFont.family 
                        }}
                      >
                        {char}
                      </div>
                    ))}
                    {characterSets.greek.lowercase.map(char => (
                      <div 
                        key={char} 
                        className="aspect-square flex items-center justify-center text-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                        style={{ 
                          fontFamily: defaultFont.postscriptName || defaultFont.family 
                        }}
                      >
                        {char}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Always show Latin as fallback if the language is not supported */}
          {charSetType !== 'latin' && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Latin (Basic)</h4>
              <div className="grid grid-cols-12 gap-1 border rounded-md overflow-hidden">
                {characterSets.latin.uppercase.slice(0, 12).map(char => (
                  <div 
                    key={char} 
                    className="aspect-square flex items-center justify-center text-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                    style={{ 
                      fontFamily: defaultFont.postscriptName || defaultFont.family 
                    }}
                  >
                    {char}
                  </div>
                ))}
                {characterSets.latin.lowercase.slice(0, 12).map(char => (
                  <div 
                    key={char} 
                    className="aspect-square flex items-center justify-center text-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                    style={{ 
                      fontFamily: defaultFont.postscriptName || defaultFont.family 
                    }}
                  >
                    {char}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderInformation = () => {
    // For info tab, we use the primary font (likely Regular) as reference
    const primaryFont = family.fonts.find(f => f.style.toLowerCase().includes('regular')) || family.fonts[0];
    
    // Handle copy and export actions
    const handleCopyName = () => {
      selectFont(primaryFont, false, false);
      copySelectedFontNames();
    };

    const handleExportFont = () => {
      selectFont(primaryFont, false, false);
      exportSelectedFonts();
    };

    // Handle description and URL updates
    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDescription(e.target.value);
      family.description = e.target.value;
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomUrl(e.target.value);
      family.customUrl = e.target.value;
    };
    
    // Handle rating click and double-click
    const handleRatingClick = (star: number) => {
      setRating(star);
      family.rating = star;
    };
    
    const handleRatingDoubleClick = () => {
      setRating(0);
      family.rating = 0;
    };
    
    // Metadata fields
    const metadataFields = [
      { label: 'Postscript Name', value: primaryFont.postscriptName || 'N/A' },
      { label: 'Full Name', value: primaryFont.fullName || 'N/A' },
      { label: 'Family', value: primaryFont.family || 'N/A' },
      { label: 'Available Styles', value: `${family.fonts.length} (${family.fonts.map(f => f.style).join(', ')})` },
      { label: 'Language Support', value: family.language || 'N/A' },
      { label: 'Tags', value: (primaryFont.tags && primaryFont.tags.length > 0) ? primaryFont.tags.join(', ') : 'None' },
    ];
    
    return (
      <div className="p-6 space-y-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Font Information</h3>
        
        {/* Simplified Description field */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h4>
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            rows={3}
            placeholder="Add a description for this font family..."
          />
        </div>
        
        {/* Simplified Custom URL field */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Website / Source</h4>
          <input
            type="url"
            value={customUrl}
            onChange={handleUrlChange}
            className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="https://example.com/font-source"
          />
          {customUrl && (
            <div className="mt-2 flex items-center text-blue-500 dark:text-blue-400 text-sm">
              <ExternalLink size={14} className="mr-1" />
              <a href={customUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                Visit site
              </a>
            </div>
          )}
        </div>
        
        {/* Rating with double-click reset */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</h4>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingClick(star)}
                onDoubleClick={handleRatingDoubleClick}
                className="text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400 transition-colors"
                title={star === 1 && rating > 0 ? "Double-click to reset" : undefined}
              >
                <Star
                  size={24}
                  fill={rating >= star ? '#FBBF24' : 'none'}
                  className={rating >= star ? 'text-yellow-400' : ''}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              {rating > 0 ? `${rating}/5` : 'Not rated yet'} {rating > 0 && <span className="text-xs opacity-60">(double-click to reset)</span>}
            </span>
          </div>
        </div>
        
        {/* Metadata */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-4">
          {metadataFields.map((field, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
              <span className="font-medium text-gray-600 dark:text-gray-400">{field.label}</span>
              <span className="col-span-2 text-gray-800 dark:text-gray-200 break-all">{field.value}</span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">Font Type:</span> {primaryFont.postscriptName?.endsWith('.ttf') ? 'TrueType' : 'OpenType'}
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={handleCopyName}
              className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium transition-colors"
            >
              <Copy size={16} className="mr-1.5" />
              Copy Name
            </button>
            <button 
              onClick={handleExportFont}
              className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium transition-colors"
            >
              <Download size={16} className="mr-1.5" />
              Export Font
            </button>
          </div>
        </div>
      </div>
    );
  };

  const tabs: TabName[] = ['Preview', 'Waterfall', 'Glyphs', 'Information'];

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fadeIn"
      onClick={onClose} // Close on backdrop click
    >
      <div 
        className="bg-white dark:bg-gray-800 w-full max-w-5xl h-[90vh] rounded-lg shadow-xl overflow-hidden flex flex-col animate-slideUp"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Header */} 
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{family.name}</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {family.fonts.length} style{family.fonts.length !== 1 ? 's' : ''} • {family.language || 'English'}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Bar */} 
        <div className="px-4 py-2 border-b dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-700/50">
          <nav className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${ 
                  activeTab === tab
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */} 
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
          {activeTab === 'Preview' && renderPreview()}
          {activeTab === 'Waterfall' && renderWaterfall()}
          {activeTab === 'Glyphs' && renderGlyphs()}
          {activeTab === 'Information' && renderInformation()}
        </div>
      </div>
    </div>
  );
} 