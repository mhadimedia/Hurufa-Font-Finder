import React from 'react';
import { useFontStore } from '../store';

export const FontControls: React.FC = () => {
  const { 
    fontSize, 
    setFontSize,
    customText, 
    setCustomText,
    textColor,
    setTextColor,
    lineHeight,
    setLineHeight,
    letterSpacing,
    setLetterSpacing
  } = useFontStore();

  return (
    <div className="max-w-4xl mx-auto mt-4 bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
      {/* Custom Text Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Sample Text
        </label>
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="The quick brown fox jumps over the lazy dog"
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Font Size Slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Font Size
          </label>
          <span className="text-sm text-gray-500 dark:text-gray-400">{fontSize}px</span>
        </div>
        <input
          type="range"
          min="8"
          max="72"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Text Color */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Text Color
        </label>
        <input
          type="color"
          value={textColor}
          onChange={(e) => setTextColor(e.target.value)}
          className="h-8 w-16 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
        />
      </div>

      {/* Line Height Slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Line Height
          </label>
          <span className="text-sm text-gray-500 dark:text-gray-400">{lineHeight}</span>
        </div>
        <input
          type="range"
          min="1"
          max="3"
          step="0.1"
          value={lineHeight}
          onChange={(e) => setLineHeight(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Letter Spacing Slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Letter Spacing
          </label>
          <span className="text-sm text-gray-500 dark:text-gray-400">{letterSpacing}em</span>
        </div>
        <input
          type="range"
          min="-0.1"
          max="0.5"
          step="0.01"
          value={letterSpacing}
          onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>
    </div>
  );
}; 