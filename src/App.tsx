import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { FontCard } from './components/FontCard';
import { Sidebar } from './components/Sidebar';
import { SelectionMenuBar } from './components/SelectionMenuBar';
import { useFontStore } from './store';
import { Font, CategoryType, FontFamily, FontCategory } from './types';
import { AlertCircle, Loader2, RefreshCw, Tag, Folder, AppWindow, ChevronDown, ChevronRight, Globe, Search, X, PanelLeftClose, PanelLeftOpen, Code, Type, Pen, LayoutGrid, List, Rows, Check } from 'lucide-react';
import { categorizeFonts, detectLanguageFromName } from './utils/fontUtils';
import HurufaIcon from './assets/hurufa-icon.png';
import { FontDetailPage } from './components/FontDetailPage';

// Add error boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            <p>Something went wrong. Please check the console for details.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const { 
    fonts, 
    fontCategories, 
    loading, 
    error, 
    setFonts, 
    setFontCategories, 
    setLoading, 
    setError,
    selectAllFonts,
    deselectAllFonts,
    moveSelectedFonts,
    selectFont,
    selectedFonts,
    selectFontsByIds,
    bulkUpdateTags
  } = useFontStore();
  
  const [needsActivation, setNeedsActivation] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [mainPageCollapsed, setMainPageCollapsed] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(220); // Further reduced default width
  const [widthBeforeCollapse, setWidthBeforeCollapse] = useState(220); // Store width
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'stack'>('grid');
  const [detailedFontFamily, setDetailedFontFamily] = useState<FontFamily | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'tag' | 'language' | 'search'>('all');
  const [activeFilterValue, setActiveFilterValue] = useState<string | null>(null);
  const selectionBoxRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const dragUpdateThrottleRef = useRef<number | null>(null);
  const minSidebarWidth = 200;
  const maxSidebarWidth = 600;

  // Function to scroll main content to top
  const scrollToTop = useCallback(() => {
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Make sure all categories are collapsed in sidebar when they're loaded
  useEffect(() => {
    if (fontCategories.length > 0) {
      const allCategoriesCollapsed = new Set<string>();
      fontCategories.forEach(category => {
        allCategoriesCollapsed.add(category.name);
      });
      setCollapsedSections(allCategoriesCollapsed);
    }
  }, [fontCategories]);

  // Handle sidebar resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // If clicking the handle on a collapsed sidebar, expand it first
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      setSidebarWidth(minSidebarWidth); 
    }
    setIsResizing(true);
  }, [isSidebarCollapsed]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    // Auto-collapse threshold (e.g., 50px less than min width)
    const collapseThreshold = minSidebarWidth - 50;

    if (newWidth < collapseThreshold) {
      if (!isSidebarCollapsed) {
        setWidthBeforeCollapse(sidebarWidth); // Store current width before collapsing
        setIsSidebarCollapsed(true);
      }
    } else {
      setIsSidebarCollapsed(false); // Ensure it's not collapsed if dragging wider
      const clampedWidth = Math.max(minSidebarWidth, Math.min(newWidth, maxSidebarWidth));
      setSidebarWidth(clampedWidth);
    }
  }, [isResizing, isSidebarCollapsed, sidebarWidth]);

  // Handle drag selection
  const handleDragStart = (e: React.MouseEvent) => {
    // Only start drag if not clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, input, .menu, .no-drag')) {
      return;
    }

    const mainContent = mainContentRef.current;
    if (!mainContent) return;

    const rect = mainContent.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });
    setDragEnd({ x, y });
    
    // Add dragging class to body to prevent text selection
    document.body.classList.add('dragging');
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !mainContentRef.current) return;

    // Throttle drag updates for better performance
    if (dragUpdateThrottleRef.current) return;
    
    dragUpdateThrottleRef.current = window.setTimeout(() => {
      dragUpdateThrottleRef.current = null;
    }, 16); // ~60fps

    const rect = mainContentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragEnd({ x, y });

    // Find intersecting font cards
    const selectionBox = selectionBoxRef.current;
    if (!selectionBox) return;

    const selectionRect = selectionBox.getBoundingClientRect();
    const fontCards = mainContentRef.current.querySelectorAll('.font-card');
    
    fontCards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const intersects = !(
        cardRect.right < selectionRect.left ||
        cardRect.left > selectionRect.right ||
        cardRect.bottom < selectionRect.top ||
        cardRect.top > selectionRect.bottom
      );

      if (intersects) {
        const fontId = card.getAttribute('data-font-id');
        if (fontId) {
          const font = fonts.find(f => (f.postscriptName || f.fullName) === fontId);
          if (font) {
            selectFont(font, true, false);
          }
        }
      }
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    document.body.classList.remove('dragging');
  };

  // Calculate selection box style
  const selectionBoxStyle = useMemo(() => {
    if (!isDragging || !dragStart || !dragEnd) return null;

    const left = Math.min(dragStart.x, dragEnd.x);
    const top = Math.min(dragStart.y, dragEnd.y);
    const width = Math.abs(dragEnd.x - dragStart.x);
    const height = Math.abs(dragEnd.y - dragStart.y);

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      position: 'absolute',
      border: '2px solid #3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      pointerEvents: 'none',
      zIndex: 10
    } as const;
  }, [isDragging, dragStart, dragEnd]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isInputField = e.target instanceof HTMLInputElement || 
                         e.target instanceof HTMLTextAreaElement ||
                         (e.target instanceof HTMLElement && e.target.isContentEditable);
                         
    if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
      if (!isInputField) {
        e.preventDefault();
        selectAllFonts();
      }
    } else if (e.key === 'Escape') {
      deselectAllFonts();
      setSearchQuery(''); // Clear search on escape
      setFilterType('all'); // Reset filter type
      setActiveFilterValue(null);
    }
  }, [selectAllFonts, deselectAllFonts]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Modify filteredCategories based on filterType and activeFilterValue
  const filteredCategories = useMemo((): FontCategory[] => {
    const query = searchQuery.trim().toLowerCase();

    if (query) {
      const matchingFamilies: FontFamily[] = [];
      const uniqueFamilyNames = new Set<string>(); 
      const categoriesToSearch = fontCategories.filter(cat => cat.type === CategoryType.TAG || cat.type === CategoryType.LANGUAGE);

      categoriesToSearch.forEach(category => { 
        if (category.families) { 
          category.families.forEach(family => { 
            if (family.name.toLowerCase().includes(query) && !uniqueFamilyNames.has(family.name)) {
              uniqueFamilyNames.add(family.name);
              matchingFamilies.push({ 
                name: family.name, 
                fonts: family.fonts, 
                tags: family.tags || [], 
                language: family.language 
              });
            }
          });
        }
      });
      
      return [
        {
          name: `Search Results for "${searchQuery.trim()}"`,
          type: CategoryType.SEARCH,
          families: matchingFamilies
        }
      ];
    } else if (filterType === 'language') {
      if (activeFilterValue === null) {
        const languagesMap: Record<string, FontCategory> = {};
        fonts.forEach(font => {
          const lang = font.language || 'Unknown';
          if (!languagesMap[lang]) {
            languagesMap[lang] = { name: lang, type: CategoryType.LANGUAGE, families: [] }; 
          }
          // Find existing family or create new one
          let family = languagesMap[lang].families.find(f => f.name === font.family);
          if (!family) {
            family = { 
              name: font.family, 
              fonts: [], // Initialize fonts array
              tags: font.tags || [], 
              language: lang // Assign the determined language
            }; 
            languagesMap[lang].families.push(family);
          }
          // Now we know family is defined, push the font
          // Ensure fonts array exists (it should due to initialization)
          if (!family.fonts) family.fonts = []; 
          family.fonts.push(font);
        });
        // Sort families within each category
        Object.values(languagesMap).forEach(langCat => {
          // Check families exists before sorting
          if (langCat.families) { 
            langCat.families.sort((a, b) => a.name.localeCompare(b.name));
          }
        });
        return Object.values(languagesMap).sort((a, b) => a.name.localeCompare(b.name));
      } else {
        const language = activeFilterValue;
        // Use a clear type for the accumulator
        const familiesMap = fonts
          .filter(font => font.language === language)
          .reduce((acc: Record<string, FontFamily>, font) => { 
            const familyKey = font.family;
            if (!acc[familyKey]) {
              acc[familyKey] = { name: font.family, fonts: [], language: language, tags: font.tags || [] }; 
            }
            acc[familyKey].fonts.push(font);
            return acc;
          }, {}); 
          
        return [
          {
            name: language,
            type: CategoryType.LANGUAGE,
            families: Object.values(familiesMap).sort((a, b) => a.name.localeCompare(b.name))
          }
        ];
      }
    } else if (filterType === 'tag' && activeFilterValue) {
      const tag = activeFilterValue;
      const category = fontCategories.find(cat => cat.name === tag && cat.type === CategoryType.TAG);
      return category ? [category] : []; 
    } else {
      return fontCategories.filter(cat => cat.type === CategoryType.TAG);
    }
  }, [fontCategories, searchQuery, filterType, activeFilterValue, fonts]);

  useEffect(() => {
    console.log('App mounted');
    // Check if we already have permission
    const hasPermission = localStorage.getItem('fontAccessPermission') === 'granted';
    console.log('Has permission:', hasPermission);
    if (hasPermission) {
      setNeedsActivation(false);
      loadFonts();
    }
  }, []);

  async function loadFonts() {
    setLoading(true);
    setError(null);
    setRetrying(false);

    try {
      if (!('queryLocalFonts' in window)) {
        throw new Error('Font Access API is not supported in your browser');
      }

      // @ts-expect-error - Font Access API types not yet in TypeScript
      const fontData = await window.queryLocalFonts();
      
      const fonts: Font[] = fontData.map((font: { family: string; fullName: string; style: string; postscriptName: string }) => ({
        family: font.family,
        fullName: font.fullName,
        style: font.style,
        postscriptName: font.postscriptName,
        tags: [],
        language: detectLanguageFromName(font.family), // Auto-detect language from font name
        recommendations: []
      }));

      setFonts(fonts);
      setFontCategories(categorizeFonts(fonts));
      setNeedsActivation(false);
      localStorage.setItem('fontAccessPermission', 'granted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fonts');
    } finally {
      setLoading(false);
    }
  }

  const handleRetry = () => {
    setRetrying(true);
    loadFonts();
  };

  const handleUpdateFont = (updatedFont: Font, newTags: string[], newLanguage: string) => {
    // Update the font with new tags and language
    const updatedFonts = fonts.map(font => 
      font.fullName === updatedFont.fullName
        ? { ...font, tags: newTags, language: newLanguage }
        : font
    );
    
    // Update the fonts in the store
    setFonts(updatedFonts);
    
    // Re-categorize fonts to update the sidebar
    const newCategories = categorizeFonts(updatedFonts);
    setFontCategories(newCategories);
  };

  const handleCategoryClick = (categoryName: string, type: CategoryType) => {
    setSearchQuery(''); // Clear search when a category is clicked
    let filterChanged = false;
    let shouldScroll = false;

    // If categoryName is empty, it means we're clicking on the main section header
    if (categoryName === '') {
      if (type === CategoryType.TAG) {
        if (filterType !== 'all' || activeFilterValue !== null) {
          setFilterType('all'); 
          setActiveFilterValue(null);
          filterChanged = true;
          shouldScroll = true;
        }
      } else if (type === CategoryType.LANGUAGE) {
        if (filterType !== 'language' || activeFilterValue !== null) {
          setFilterType('language'); // Set filter for all languages
          setActiveFilterValue(null); // Indicate show all
          filterChanged = true;
          shouldScroll = true;
        }
      }
      // When clicking main header, don't change collapse state
      // Scroll handled by Sidebar calling scrollToTop directly
    } else {
      // Normal category click (specific tag or language)
      let newFilterType: 'tag' | 'language' | null = null;
      if (type === CategoryType.TAG) {
        newFilterType = 'tag';
      } else if (type === CategoryType.LANGUAGE) {
        newFilterType = 'language';
      }
      
      if (filterType !== newFilterType || activeFilterValue !== categoryName) {
        if (newFilterType) setFilterType(newFilterType);
        setActiveFilterValue(categoryName);
        filterChanged = true;
        shouldScroll = true;
      }
      
      // DO NOT Expand when clicking the category name itself
      // setCollapsedSections(prev => { ... }); // <--- REMOVED THIS BLOCK
    }

    // Scroll to top if needed
    if (shouldScroll) {
      // Use timeout to allow state update and re-render before scrolling
      setTimeout(scrollToTop, 0); 
    }
  };

  const toggleSection = (categoryName: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(categoryName)) {
      newCollapsed.delete(categoryName);
    } else {
      newCollapsed.add(categoryName);
    }
    setCollapsedSections(newCollapsed);
  };

  // --- Font Detail Page Logic ---
  const showFontDetails = useCallback((family: FontFamily) => {
    setDetailedFontFamily(family);
  }, []);

  const hideFontDetails = useCallback(() => {
    setDetailedFontFamily(null);
  }, []);
  // ------------------------------

  // Handle drag and drop on sidebar categories
  const handleSidebarDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    // Add visual feedback for the drop target
    const target = e.currentTarget as HTMLElement;
    target.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
  }, []);

  const handleSidebarDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Remove visual feedback
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
  }, []);

  const handleSidebarDrop = useCallback((e: React.DragEvent, category: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Remove visual feedback
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');

    // Move the font to the new category
    moveSelectedFonts(category);
  }, [moveSelectedFonts]);

  // Handle click outside to deselect
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('.font-card') && !target.closest('.selection-menu')) {
        deselectAllFonts();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [deselectAllFonts]);

  // --- Main Page Header Logic --- 
  const handleHeaderClick = useCallback((categoryId: string) => {
    const element = document.getElementById(categoryId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleHeaderToggle = useCallback((categoryName: string) => {
    setMainPageCollapsed(prev => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(categoryName)) {
        newCollapsed.delete(categoryName);
      } else {
        newCollapsed.add(categoryName);
      }
      return newCollapsed;
    });
  }, []);

  const handleSelectAllInCategory = useCallback((category: FontCategory) => {
    if (!category.families) return;
    
    const categoryFontIds = category.families.flatMap(family => 
      family.fonts.map(font => font.postscriptName || font.fullName)
    );
    
    // Check if ALL fonts in this category are currently selected
    const areAllSelected = categoryFontIds.every(id => selectedFonts.has(id));
    
    // Select if not all are selected, deselect if all are selected
    selectFontsByIds(categoryFontIds, !areAllSelected);

  }, [selectedFonts, selectFontsByIds]);
  // --- End Main Page Header Logic --- 

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex flex-col items-center gap-4 max-w-md">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
          >
            <RefreshCw size={16} className={retrying ? 'animate-spin' : ''} />
            {retrying ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (needsActivation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md">
          <img src={HurufaIcon} alt="Hurufa Logo" className="w-20 h-20 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Welcome to Hurufa</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            To get started, please grant permission to access your local fonts. 
            This allows Hurufa to discover and manage your font library.
          </p>
          <button
            onClick={loadFonts}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition duration-150 ease-in-out"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 size={20} className="animate-spin mr-2" />
                Requesting...
              </span>
            ) : (
              'Grant Font Access'
            )}
          </button>
          {error && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">Error: {error}</p>
          )}
        </div>
      </div>
    );
  }

  const allCategories = Array.from(new Set(fontCategories.map(cat => cat.name)));

  return (
    <ErrorBoundary>
      <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Window drag region */}
        <div className="fixed top-0 left-0 right-0 h-8 app-drag-region" />
        
        {/* Sidebar */}
        <div 
          className={`sidebar-container fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 z-20 ${
            isSidebarCollapsed ? 'w-0' : ''
          }`}
          style={{ width: isSidebarCollapsed ? '0' : `${sidebarWidth}px` }}
        >
          <Sidebar
            categories={fontCategories}
            collapsedSections={collapsedSections}
            toggleSection={toggleSection}
            onCategoryClick={handleCategoryClick}
            onRenameCategory={(oldName, newName) => {
              const updatedFonts = fonts.map(font => {
                if (font.tags?.includes(oldName)) {
                  const tags = [...(font.tags || [])];
                  const index = tags.indexOf(oldName);
                  if (index !== -1) {
                    tags[index] = newName;
                  }
                  return { ...font, tags };
                }
                return font;
              });
              setFonts(updatedFonts);
              setFontCategories(categorizeFonts(updatedFonts));
            }}
            scrollToTop={scrollToTop}
          />

          {/* Resize handle */}
          <div
            className={`absolute h-full w-1 bg-transparent hover:bg-blue-500 cursor-col-resize z-10 transition-colors ${
              isResizing ? 'bg-blue-500' : ''
            }`}
            style={{ 
              right: '0',
              top: 0,
              cursor: 'col-resize'
            }}
            onMouseDown={handleMouseDown}
          />
        </div>

        {/* Main content */}
        <div 
          ref={mainContentRef}
          className="main-content-container flex-1 h-screen overflow-y-auto"
          style={{ marginLeft: isSidebarCollapsed ? '0' : `${sidebarWidth}px` }}
        >
          {/* Toggle sidebar button */}
          <button
            onClick={() => {
              if (isSidebarCollapsed) {
                // Expand to min width when clicking the open button
                setSidebarWidth(minSidebarWidth);
              } else {
                // Store width before collapsing manually
                setWidthBeforeCollapse(sidebarWidth);
              }
              setIsSidebarCollapsed(!isSidebarCollapsed)
            }}
            onMouseUp={(e) => e.currentTarget.blur()}
            className="fixed top-[10px] left-[85px] z-30 p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white focus:outline-none focus:ring-0 focus:ring-offset-0" // Focus style
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>

          {/* Content area */}
          <div 
            className="relative min-h-screen p-6"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            {isDragging && selectionBoxStyle && (
              <div ref={selectionBoxRef} style={selectionBoxStyle} />
            )}

            {/* Search bar */}
            <header className="mt-2 mb-8">
              <div className="relative max-w-4xl mx-auto flex items-center gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search fonts..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-blue-500 dark:focus:border-blue-500 transition-all duration-200"
                  />
                  <Search 
                    size={16} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" 
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 p-1 rounded-full border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-full transition-colors focus:outline-none focus-visible:ring-0 ${
                      viewMode === 'grid' 
                        ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title="Grid view"
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('stack')}
                    className={`p-2 rounded-full transition-colors focus:outline-none focus-visible:ring-0 ${
                      viewMode === 'stack' 
                        ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title="Stack view"
                  >
                    <Rows size={16} />
                  </button>
                </div>
              </div>
            </header>

            {/* Selection menu - centered under search */}
            <div className="selection-menu max-w-4xl mx-auto mb-8">
              <SelectionMenuBar 
                allCategories={fontCategories.filter(c => c.type === CategoryType.TAG).map(c => c.name)}
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Loader2 size={20} className="animate-spin" />
                  <p>Loading your fonts...</p>
                </div>
              </div>
            ) : (
              <div className="max-w-7xl mx-auto space-y-12">
                {(filteredCategories as FontCategory[]).map((category: FontCategory) => {
                   // Calculate if all fonts in this category are selected
                   const categoryFontIds = category.families?.flatMap(f => f.fonts.map(font => font.postscriptName || font.fullName)) || [];
                   const areAllInCategorySelected = categoryFontIds.length > 0 && categoryFontIds.every(id => selectedFonts.has(id));

                  return (
                    <div 
                      key={category.name} 
                      id={category.name} // ID for scrolling
                      className="space-y-6 animate-fadeIn"
                      onDragOver={(e) => handleSidebarDragOver(e)}
                      onDragLeave={handleSidebarDragLeave}
                      onDrop={(e) => handleSidebarDrop(e, category.name)}
                    >
                      {/* --- Modified Header Structure --- */}
                      <div className="flex items-center gap-3 w-full text-left group transition-colors">
                        {/* Select All Circle */}
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); // Prevent header click
                            handleSelectAllInCategory(category);
                          }}
                          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-150 focus:outline-none focus:ring-0 focus:ring-offset-0 ${ 
                            areAllInCategorySelected 
                              ? 'bg-blue-600 border-blue-600 hover:bg-blue-700 hover:border-blue-700' 
                              : 'border-gray-400 dark:border-gray-500 hover:border-blue-500'
                          }`}
                          title={areAllInCategorySelected ? 'Deselect all in category' : 'Select all in category'}
                        >
                          {areAllInCategorySelected && <Check size={14} className="text-white stroke-[3]" />}
                        </button>
                        
                        {/* Category Icon and Name (Clickable for Scroll) */}
                        <button 
                          onClick={() => handleHeaderClick(category.name)}
                          className="flex items-center gap-2 flex-grow min-w-0 focus:outline-none"
                          title={`Scroll to ${category.name}`}
                        >
                          {/* Category Icon */}
                          <div className="flex-shrink-0">
                            {category.type === CategoryType.TAG ? (
                              <Folder size={20} className="text-blue-600 dark:text-blue-400" />
                            ) : category.type === CategoryType.SEARCH ? (
                              <Search size={20} className="text-purple-600 dark:text-purple-400" />
                            ) : ( // Assumed LANGUAGE type here
                              <Globe size={20} className="text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          {/* Category Name (Display name uses CategoryType enum value) */}
                          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {category.name.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                            ).join(' ')}
                          </h2>
                          {/* Family Count */}
                          <span className="text-gray-500 dark:text-gray-400 text-sm flex-shrink-0">
                            ({category.families?.length || 0} families)
                          </span>
                        </button>
                        
                        {/* Collapse Toggle Chevron */}
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); // Prevent header click
                            handleHeaderToggle(category.name);
                          }}
                          className="ml-auto p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded focus:outline-none focus:ring-0 focus:ring-offset-0"
                          title={mainPageCollapsed.has(category.name) ? 'Expand category' : 'Collapse category'}
                        >
                           {mainPageCollapsed.has(category.name) ? (
                            <ChevronRight size={20} className="transition-transform duration-200" />
                          ) : (
                            <ChevronDown size={20} className="transition-transform duration-200" />
                          )}
                        </button>
                      </div>
                      {/* --- End Modified Header Structure --- */}
                      
                      {/* Font Grid/Stack */}
                      {!mainPageCollapsed.has(category.name) && (
                        <div className={`
                          ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn overflow-hidden' : ''}
                          ${viewMode === 'stack' ? 'flex flex-col gap-4 animate-fadeIn overflow-hidden' : ''}
                        `}>
                          {category.families && category.families.map((family: FontFamily) => (
                            <div 
                              key={family.name} 
                              className={`font-card ${viewMode === 'grid' ? 'h-full w-full' : 'w-full'}`}
                              id={family.name}
                            >
                              <FontCard
                                fonts={family.fonts}
                                familyName={family.name}
                                category={category.name}
                                allCategories={allCategories}
                                onUpdateFont={handleUpdateFont}
                                viewMode={viewMode}
                                onShowDetails={() => showFontDetails(family)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Conditionally render Font Detail Page */} 
      {detailedFontFamily && (
        <FontDetailPage 
          family={detailedFontFamily} 
          onClose={hideFontDetails} 
        />
      )}
    </ErrorBoundary>
  );
}

export default App;