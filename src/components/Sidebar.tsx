import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Tag } from 'lucide-react';
import { FontCategory } from '../types';

const LANGUAGE_CATEGORIES = ['ARABIC', 'CHINESE', 'JAPANESE', 'KOREAN', 'THAI', 'HEBREW', 'DEVANAGARI'];

interface SidebarProps {
  categories: FontCategory[];
  onCategoryClick: (categoryName: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  onCategoryClick,
  onRenameCategory,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const handleRenameStart = (categoryName: string) => {
    setRenamingCategory(categoryName);
    setNewCategoryName(categoryName.replace(/_/g, ' ').toLowerCase());
  };

  const handleRenameComplete = () => {
    if (renamingCategory && newCategoryName.trim()) {
      onRenameCategory(renamingCategory, newCategoryName.trim());
    }
    setRenamingCategory(null);
    setNewCategoryName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameComplete();
    } else if (e.key === 'Escape') {
      setRenamingCategory(null);
      setNewCategoryName('');
    }
  };

  const isLanguageCategory = (categoryName: string) => {
    return LANGUAGE_CATEGORIES.some(lang => 
      categoryName.toUpperCase().includes(lang)
    );
  };

  const regularCategories = categories.filter(cat => !isLanguageCategory(cat.name));
  const languageCategories = categories.filter(cat => isLanguageCategory(cat.name));

  const formatCategoryName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderCategory = (category: FontCategory) => (
    <div key={category.name} className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCategoryClick(category.name)}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
          >
            <Tag size={16} className="text-blue-500" />
            {renamingCategory === category.name ? (
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleRenameComplete}
                className="text-sm border rounded px-1"
                autoFocus
              />
            ) : (
              <span
                onDoubleClick={() => handleRenameStart(category.name)}
                className="cursor-pointer"
              >
                {formatCategoryName(category.name)}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={() => toggleCategory(category.name)}
          className="text-gray-500 hover:text-gray-700"
        >
          {expandedCategories.has(category.name) ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </button>
      </div>
      {expandedCategories.has(category.name) && (
        <div className="pl-4 space-y-1">
          {category.families.map((family) => (
            <button
              key={family.name}
              onClick={() => onCategoryClick(category.name)}
              className="w-full flex items-center gap-2 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <span>{family.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed left-0 top-0 w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
        <div className="space-y-4">
          {/* Regular Categories */}
          <div className="space-y-2">
            {regularCategories.map(renderCategory)}
          </div>

          {/* Language Categories */}
          {languageCategories.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-4"></div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Language Fonts
              </h3>
              <div className="space-y-2">
                {languageCategories.map(renderCategory)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 