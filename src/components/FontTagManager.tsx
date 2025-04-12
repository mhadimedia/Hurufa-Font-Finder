import React, { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Font } from '../types';

interface FontTagManagerProps {
  font: Font;
  allCategories: string[];
  onUpdateTags: (font: Font, newTags: string[]) => void;
}

export const FontTagManager: React.FC<FontTagManagerProps> = ({
  font,
  allCategories,
  onUpdateTags,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);

  const handleAddTag = (tag: string) => {
    if (!tag.trim()) return;
    const newTags = [...(font.category ? [font.category] : []), tag];
    onUpdateTags(font, newTags);
    setNewTag('');
    setShowNewTagInput(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = (font.category ? [font.category] : []).filter(tag => tag !== tagToRemove);
    onUpdateTags(font, newTags);
  };

  const availableTags = allCategories.filter(
    category => !font.category?.includes(category)
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <Tag size={14} />
        <span>Tags</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
          <div className="space-y-2">
            {font.category && (
              <div className="flex flex-wrap gap-1">
                {font.category.split(',').map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {showNewTagInput ? (
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTag(newTag);
                    }
                  }}
                  placeholder="New tag..."
                  className="flex-1 px-2 py-1 text-sm border rounded"
                  autoFocus
                />
                <button
                  onClick={() => handleAddTag(newTag)}
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewTagInput(true)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 w-full px-2 py-1 hover:bg-gray-100 rounded"
              >
                <Plus size={14} />
                <span>Add tag</span>
              </button>
            )}

            {availableTags.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <p className="text-xs text-gray-500 mb-1">Existing tags:</p>
                <div className="flex flex-wrap gap-1">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs hover:bg-gray-200"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 