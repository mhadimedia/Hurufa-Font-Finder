import { create } from 'zustand';
import { Font, FontCategory } from './types';
import { categorizeFonts } from './utils/fontUtils';

interface StoreState {
  fonts: Font[];
  fontCategories: FontCategory[];
  loading: boolean;
  error: string | null;
  setFonts: (fonts: Font[]) => void;
  setFontCategories: (categories: FontCategory[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFontStore = create<StoreState>((set) => ({
  fonts: [],
  fontCategories: [],
  loading: false,
  error: null,
  
  setFonts: (fonts) => set({ fonts }),
  setFontCategories: (fontCategories) => set({ fontCategories }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));