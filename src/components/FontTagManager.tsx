import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useStore } from '../store';

interface FontTagManagerProps {
  font: string;
  currentTags: string[];
}

export function FontTagManager({ font, currentTags }: FontTagManagerProps) {
  const [newTag, setNewTag] = useState('');
  const { tags, updateFontTags, addTag } = useStore();

  const handleAddTag = () => {
    if (newTag.trim() && !currentTags.includes(newTag.trim())) {
      const updatedTags = [...currentTags, newTag.trim()];
      updateFontTags(font, updatedTags);
      addTag(newTag.trim());
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
    updateFontTags(font, updatedTags);
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
      
      <div className="flex gap-1">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
          placeholder="Add tag..."
          className="flex-1 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddTag}
          className="p-1 text-blue-600 hover:text-blue-800"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
} 