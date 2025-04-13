import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useFontStore } from '../store';
import { Font } from '../types';

interface FontTagManagerProps {
  font: Font;
  allCategories: string[];
  onUpdateTags: (font: Font, newTags: string[]) => void;
}

export function FontTagManager({ font, allCategories, onUpdateTags }: FontTagManagerProps) {
  const [newTag, setNewTag] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentTags = font.tags || [];

  const handleAddTag = (tagToAdd: string) => {
    const trimmedTag = tagToAdd.trim();
    if (trimmedTag && !currentTags.includes(trimmedTag)) {
      const updatedTags = [...currentTags, trimmedTag];
      onUpdateTags(font, updatedTags);
      setNewTag('');
      // Explicitly hide suggestions after adding
      setShowSuggestions(false); 
    } else if (trimmedTag && currentTags.includes(trimmedTag)) {
      // If tag exists but user tried adding again, just clear/hide
      setNewTag('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
    onUpdateTags(font, updatedTags);
  };

  // Filter suggestions based on input and exclude already selected tags
  const getSuggestions = () => {
    const input = newTag.toLowerCase();
    
    // Filter available tags based on input and current tags
    const availableTags = allCategories
      .filter(tag => !currentTags.includes(tag))
      .filter(tag => tag.toLowerCase().includes(input))
      .filter(tag => tag !== 'Uncategorized'); // Don't show Uncategorized as an option

    // Group tags into predefined categories
    const suggestions = [];

    // Add existing sidebar tags
    if (availableTags.length > 0) {
      suggestions.push({
        category: 'Available Tags',
        tags: availableTags
      });
    }

    // Allow adding new custom tags if the input doesn't match any existing tags
    if (newTag.trim() && !allCategories.some(tag => 
      tag.toLowerCase() === newTag.trim().toLowerCase()
    )) {
      suggestions.push({
        category: 'Create New Tag',
        tags: [newTag.trim()]
      });
    }

    return suggestions;
  };

  // Close suggestions when clicking outside
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
        {currentTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
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
            value={newTag}
            onChange={(e) => {
              setNewTag(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newTag.trim()) {
                e.preventDefault(); // Prevent potential form submission
                handleAddTag(newTag); // This will now clear input and hide suggestions
                // No need to set state here, handleAddTag does it
              }
            }}
            placeholder="Add tag..."
            className="flex-1 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            ref={inputRef}
          />
          <button
            onClick={() => {
              if (newTag.trim()) {
                handleAddTag(newTag); // This will now clear input and hide suggestions
              }
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <Plus size={16} />
          </button>
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
                      onClick={() => handleAddTag(suggestion)}
                      className="w-full text-left px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-600 focus:bg-blue-50 dark:focus:bg-gray-600 focus:outline-none rounded"
                    >
                      {category === 'Create New Tag' ? `Create "${suggestion}"` : suggestion}
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