import React, { useEffect, useState } from 'react';
import { useFontStore } from '../store';
import { Font } from '../types';
import { Layers, Type, Code, Box, FileText, Check } from 'lucide-react';

interface FontDetailsProps {
  font: Font;
  onClose: () => void;
}

export function FontDetails({ font, onClose }: FontDetailsProps) {
  const { getFontDetails, fontMetadata, fontFeatures } = useFontStore();
  const [isLoading, setIsLoading] = useState(true);
  
  const fontId = font.postscriptName || font.fullName;
  const metadata = fontMetadata.get(fontId);
  const features = fontFeatures.get(fontId);
  
  useEffect(() => {
    async function loadFontDetails() {
      setIsLoading(true);
      await getFontDetails(font);
      setIsLoading(false);
    }
    
    loadFontDetails();
  }, [font, getFontDetails]);
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-[90%] max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{font.family} - {font.style}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading font details...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-medium flex items-center mb-3 text-gray-900 dark:text-white">
                  <FileText size={20} className="mr-2" />
                  Basic Information
                </h3>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Family</span>
                    <span className="text-gray-900 dark:text-white">{font.family}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Style</span>
                    <span className="text-gray-900 dark:text-white">{font.style}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Full Name</span>
                    <span className="text-gray-900 dark:text-white">{font.fullName || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-gray-400">PostScript Name</span>
                    <span className="text-gray-900 dark:text-white">{font.postscriptName || '-'}</span>
                  </div>
                  {metadata?.path && (
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Path</span>
                      <span className="text-gray-900 dark:text-white text-sm break-words">{metadata.path}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* OpenType Features */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-medium flex items-center mb-3 text-gray-900 dark:text-white">
                  <Code size={20} className="mr-2" />
                  OpenType Features
                </h3>
                {features && features.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <Check size={16} className="mr-1 text-green-500" />
                        <span className="text-gray-900 dark:text-white text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No OpenType features detected</p>
                )}
              </div>
              
              {/* Font Preview */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg md:col-span-2">
                <h3 className="text-lg font-medium flex items-center mb-3 text-gray-900 dark:text-white">
                  <Type size={20} className="mr-2" />
                  Preview
                </h3>
                <div 
                  className="p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700" 
                  style={{ fontFamily: font.family, fontWeight: font.style.includes('Bold') ? 'bold' : 'normal', fontStyle: font.style.includes('Italic') ? 'italic' : 'normal' }}
                >
                  <p className="text-3xl mb-4">The quick brown fox jumps over the lazy dog</p>
                  <p className="text-xl">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                  <p className="text-xl">abcdefghijklmnopqrstuvwxyz</p>
                  <p className="text-xl">0123456789 !@#$%^&*()_+</p>
                </div>
              </div>
              
              {/* System Metadata */}
              {metadata && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg md:col-span-2">
                  <h3 className="text-lg font-medium flex items-center mb-3 text-gray-900 dark:text-white">
                    <Layers size={20} className="mr-2" />
                    System Metadata
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(metadata)
                      .filter(([key]) => key !== 'path' && !key.startsWith('_'))
                      .map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{key}</span>
                          <span className="text-gray-900 dark:text-white text-sm break-words">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 