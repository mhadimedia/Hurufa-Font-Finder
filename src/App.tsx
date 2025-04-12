import React, { useEffect, useState, useMemo } from 'react';
import { FontCard } from './components/FontCard';
import { Sidebar } from './components/Sidebar';
import { useFontStore } from './store';
import { Font, FontCategory, CategoryType } from './types';
import { Text, AlertCircle, Loader2, MousePointer2, RefreshCw, Tag, ChevronDown, ChevronRight, Globe, Search, X, ChevronLeft } from 'lucide-react';
import { categorizeFonts, detectLanguageFromName } from './utils/fontUtils';
import HurafaIcon from './assets/hurafa-icon.png';

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
  const { fonts, fontCategories, loading, error, setFonts, setFontCategories, setLoading, setError } = useFontStore();
  
  const [needsActivation, setNeedsActivation] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Filter fonts based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return fontCategories;

    return fontCategories.map(category => ({
      ...category,
      families: category.families.filter(family =>
        family.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.families.length > 0);
  }, [fontCategories, searchQuery]);

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

      // @ts-ignore - Font Access API types not yet in TypeScript
      const fontData = await window.queryLocalFonts();
      
      const fonts: Font[] = fontData.map((font: any) => ({
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

  const handleCategoryClick = (categoryName: string) => {
    const element = document.getElementById(categoryName);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <img src={HurafaIcon} alt="Hurafa" className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Welcome to Hurafa</h2>
          <p className="text-gray-600 mb-6">
            To organize and manage your fonts, we need permission to access your system fonts. Click the button below to get started.
          </p>
          <button
            onClick={loadFonts}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Granting Access...
              </span>
            ) : (
              'Grant Access'
            )}
          </button>
        </div>
      </div>
    );
  }

  const allCategories = Array.from(new Set(fontCategories.map(cat => cat.name)));

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex">
        {/* Sidebar */}
        <div className={`relative w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${showSidebar ? '' : '-ml-64'}`}>
          {showSidebar && <Sidebar
            categories={fontCategories}
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
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            isOpen={showSidebar}
          />}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          {!showSidebar && (
            <button
              onClick={() => setShowSidebar(true)}
              className="fixed top-4 left-4 z-10 p-1.5 rounded-md bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight size={16} className="text-gray-600 dark:text-gray-300" />
            </button>
          )}
          {/* Search and content */}
          <div className="p-4">
            <header className="mb-8">
              <div className="relative max-w-4xl mx-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fonts..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
            </header>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Loader2 size={20} className="animate-spin" />
                  <p>Loading your fonts...</p>
                </div>
              </div>
            ) : (
              <div className="max-w-7xl mx-auto space-y-12">
                {filteredCategories.map((category) => (
                  <div 
                    key={category.name} 
                    id={category.name} 
                    className="space-y-6 animate-fadeIn"
                  >
                    <button
                      onClick={() => toggleSection(category.name)}
                      className="flex items-center gap-2 w-full text-left group"
                    >
                      <div className="flex items-center gap-2">
                        {category.type === CategoryType.TAG ? (
                          <Tag size={24} className="text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-110" />
                        ) : (
                          <Globe size={24} className="text-green-600 dark:text-green-400 transition-transform group-hover:scale-110" />
                        )}
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                          {category.name.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                          ).join(' ')}
                        </h2>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          ({category.families.length} families)
                        </span>
                      </div>
                      {collapsedSections.has(category.name) ? (
                        <ChevronDown size={20} className="ml-auto text-gray-500 dark:text-gray-400 transition-transform duration-200" />
                      ) : (
                        <ChevronRight size={20} className="ml-auto text-gray-500 dark:text-gray-400 transition-transform duration-200" />
                      )}
                    </button>
                    {!collapsedSections.has(category.name) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                        {category.families.map((family) => (
                          <FontCard
                            key={family.name}
                            fonts={family.fonts}
                            familyName={family.name}
                            category={category.name}
                            allCategories={allCategories}
                            onUpdateFont={handleUpdateFont}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;