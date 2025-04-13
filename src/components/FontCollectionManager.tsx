import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Folder } from 'lucide-react';
import { useFontStore } from '../store';
import { Font } from '../types';

interface FontCollectionManagerProps {
  font: Font;
  allCategories: string[];
  onUpdateCollection: (font: Font, newCollections: string[]) => void;
}

export function FontCollectionManager({ font, allCategories, onUpdateCollection }: FontCollectionManagerProps) {
  const [newCollection, setNewCollection] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentCollections = font.tags || [];

  const handleAddCollection = (collectionToAdd: string) => {
    const trimmedCollection = collectionToAdd.trim();
    if (trimmedCollection && !currentCollections.includes(trimmedCollection)) {
      const updatedCollections = [...currentCollections, trimmedCollection];
      onUpdateCollection(font, updatedCollections);
      setNewCollection('');
      setShowSuggestions(false); 
    } else if (trimmedCollection && currentCollections.includes(trimmedCollection)) {
      setNewCollection('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveCollection = (collectionToRemove: string) => {
    const updatedCollections = currentCollections.filter(tag => tag !== collectionToRemove);
    onUpdateCollection(font, updatedCollections);
  };

  const getSuggestions = () => {
    const input = newCollection.toLowerCase();
    
    const availableCollections = allCategories
      .filter(collection => !currentCollections.includes(collection))
      .filter(collection => collection.toLowerCase().includes(input))
      .filter(collection => collection !== 'Uncategorized');

    const suggestions = [];

    if (availableCollections.length > 0) {
      suggestions.push({
        category: 'Available Collections',
        tags: availableCollections
      });
    }

    if (newCollection.trim() && !allCategories.some(collection => 
      collection.toLowerCase() === newCollection.trim().toLowerCase()
    )) {
      suggestions.push({
        category: 'Create New Collection',
        tags: [newCollection.trim()]
      });
    }

    return suggestions;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="p-2 space-y-2" ref={containerRef}>
      <div className="flex flex-wrap gap-1">
        {currentCollections.map((collection) => (
          <span
            key={collection}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {collection}
            <button
              onClick={() => handleRemoveCollection(collection)}
              className="ml-1 text-blue-600 hover:text-blue-800"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      
      <div className="relative">
        <div className="flex gap-1">
          <input
            type="text"
            value={newCollection}
            onChange={(e) => {
              setNewCollection(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newCollection.trim()) {
                e.preventDefault();
                handleAddCollection(newCollection);
              }
            }}
            placeholder="Add collection..."
            className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            ref={inputRef}
          />
        </div>

        {showSuggestions && (
          <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 animate-fadeIn max-h-64 overflow-y-auto">
            {getSuggestions().map(({ category, tags }) => (
              <div key={category} className="py-1">
                <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-600">
                  {category}
                </div>
                <div className="space-y-0.5 p-1">
                  {tags.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleAddCollection(suggestion)}
                      className="w-full text-left px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-600 focus:bg-blue-50 dark:focus:bg-gray-600 focus:outline-none rounded"
                    >
                      {category === 'Create New Collection' ? `Create "${suggestion}"` : suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 