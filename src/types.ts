export enum CategoryType {
  TAG = 'Collections',
  LANGUAGE = 'Language',
  SEARCH = 'Search',
  // Add more category types here in the future
}

export interface Font {
  family: string;
  fullName: string;
  style: string;
  postscriptName?: string;
  preview?: string;
  tags?: string[];
  language?: string;
  recommendations?: string[];
}

export interface FontFamily {
  name: string;
  fonts: Font[];
  tags?: string[];
  language?: string;
}

export interface FontCategory {
  name: string;
  type: CategoryType;
  families: FontFamily[];
}

export interface FontState {
  fonts: Font[];
  fontCategories: FontCategory[];
  loading: boolean;
  error: string | null;
  setFonts: (fonts: Font[]) => void;
  setFontCategories: (categories: FontCategory[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}