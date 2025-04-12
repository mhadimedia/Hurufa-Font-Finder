import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Tag, Globe, ChevronLeft } from 'lucide-react';
import { FontCategory, CategoryType } from '../types';

interface SidebarProps {
  categories: FontCategory[];
  onCategoryClick: (categoryName: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onToggleSidebar: () => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  onCategoryClick,
  onRenameCategory,
  onToggleSidebar,
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
    setNewCategoryName(categoryName);
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
            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
          >
            {category.type === CategoryType.TAG ? (
              <Tag size={16} className="text-blue-500 dark:text-blue-400" />
            ) : (
              <Globe size={16} className="text-green-500 dark:text-green-400" />
            )}
            {renamingCategory === category.name ? (
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleRenameComplete}
                className="text-sm border rounded px-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
              className="w-full flex items-center gap-2 px-2 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <span>{family.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const tagCategories = categories.filter(cat => cat.type === CategoryType.TAG);
  const languageCategories = categories.filter(cat => cat.type === CategoryType.LANGUAGE);

  return (
    <div className="fixed left-0 top-0 w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      {/* macOS window controls spacing */}
      <div className="h-8" />
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Tags
          </h3>
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft size={16} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        <div className="space-y-4">
          {/* Tag Categories */}
          <div className="space-y-2">
            {tagCategories.map(renderCategory)}
          </div>

          {/* Language Categories */}
          {languageCategories.length > 0 && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Languages
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