import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Tag, Globe, Settings } from 'lucide-react';
import { FontCategory, CategoryType } from '../types';
import { useFontStore } from '../store';

interface SidebarProps {
  categories: FontCategory[];
  collapsedSections: Set<string>;
  toggleSection: (categoryName: string) => void;
  onCategoryClick: (categoryName: string, type: CategoryType) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  collapsedSections,
  toggleSection,
  onCategoryClick,
  onRenameCategory,
}) => {
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(true);

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
      <div className="flex items-center justify-between pr-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCategoryClick(category.name, category.type)}
            onMouseUp={(e) => e.currentTarget.blur()}
            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white py-1 rounded focus:outline-none"
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
          onClick={() => toggleSection(category.name)}
          onMouseUp={(e) => e.currentTarget.blur()}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded focus:outline-none"
        >
          {collapsedSections.has(category.name) ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>
      </div>
      {!collapsedSections.has(category.name) && category.families && (
        <div className="pl-6 space-y-0.5">
          {category.families.map(family => (
            <a
              key={family.name}
              href={`#${family.name}`}
              className="text-xs text-gray-600 dark:text-gray-400 truncate hover:text-blue-600 dark:hover:text-blue-400 block py-0.5"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(family.name);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              {family.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );

  const tagCategories = categories.filter(cat => cat.type === CategoryType.TAG);
  const languageCategories = categories.filter(cat => cat.type === CategoryType.LANGUAGE);

  return (
    <div className="h-full overflow-y-auto">
      {/* macOS window controls spacing with collapse button */}
      <div className="h-8 relative">
        <div className="absolute right-4 top-11">
          <button
            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
            onMouseUp={(e) => e.currentTarget.blur()}
            className="p-1.5 rounded-md hover:bg-gray-100/10 transition-colors focus:outline-none"
          >
            {isSettingsExpanded ? (
              <ChevronDown size={16} className="text-white" />
            ) : (
              <ChevronRight size={16} className="text-white" />
            )}
          </button>
        </div>
      </div>
      
      <div className="px-6 py-4">
        {/* Settings Section */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Settings
          </h3>

          {isSettingsExpanded && (
            <div className="space-y-4">
              {/* Custom Text Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sample Text
                </label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="The quick brown fox..."
                  className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
                />
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Font Size
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={fontSize}
                  onDoubleClick={() => setFontSize(24)}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  onMouseUp={(e) => e.currentTarget.blur()}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                />
              </div>

              {/* Text Color */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Text Color
                  </label>
                  <div className="relative">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-6 h-6 rounded-full overflow-hidden appearance-none cursor-pointer border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        backgroundColor: textColor,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Line Height */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Line Height
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{lineHeight}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={lineHeight}
                  onDoubleClick={() => setLineHeight(100)}
                  onChange={(e) => setLineHeight(parseInt(e.target.value))}
                  onMouseUp={(e) => e.currentTarget.blur()}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                />
              </div>

              {/* Letter Spacing */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Letter Spacing
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{letterSpacing}%</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="50"
                  value={letterSpacing}
                  onDoubleClick={() => setLetterSpacing(0)}
                  onChange={(e) => setLetterSpacing(parseInt(e.target.value))}
                  onMouseUp={(e) => e.currentTarget.blur()}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

        {/* Tags Section */}
        <div>
          <h3 
            className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
            onClick={(e) => {
              onCategoryClick('', CategoryType.TAG);
              (e.target as HTMLElement).blur();
            }}
          >
            Tags
          </h3>
          <div className="space-y-4">
            {/* Tag Categories */}
            <div className="space-y-2">
              {tagCategories.map(renderCategory)}
            </div>

            {/* Language Categories */}
            {languageCategories.length > 0 && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                <h3 
                  className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={(e) => {
                    onCategoryClick('', CategoryType.LANGUAGE);
                    (e.target as HTMLElement).blur();
                  }}
                >
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
    </div>
  );
}; 