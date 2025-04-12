export interface Font {
  family: string;
  fullName: string;
  style: string;
  postscriptName?: string;
  preview?: string;
  category?: string;
  recommendations?: string[];
  language?: string;
}

export interface FontFamily {
  name: string;
  fonts: Font[];
  category: string;
}

export interface FontCategory {
  name: string;
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