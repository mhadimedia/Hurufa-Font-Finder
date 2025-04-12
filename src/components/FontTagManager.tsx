import React, { useState } from 'react';
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
  const currentTags = font.tags || [];

  const handleAddTag = (tagToAdd: string) => {
    if (tagToAdd.trim() && !currentTags.includes(tagToAdd.trim())) {
      const updatedTags = [...currentTags, tagToAdd.trim()];
      onUpdateTags(font, updatedTags);
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

  return (
    <div className="p-2 space-y-2">
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
                handleAddTag(newTag);
              }
            }}
            placeholder="Add tag..."
            className="flex-1 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => newTag.trim() && handleAddTag(newTag)}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <Plus size={16} />
          </button>
        </div>

        {showSuggestions && (
          <div className="absolute z-20 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
            {getSuggestions().map(({ category, tags }) => (
              <div key={category} className="py-1">
                <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                  {category}
                </div>
                {tags.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleAddTag(suggestion)}
                    className="w-full text-left px-3 py-1 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 