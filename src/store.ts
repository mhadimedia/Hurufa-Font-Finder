import { create } from 'zustand';
import { Font, FontState, FontCategory } from './types';

export const useFontStore = create<FontState>((set) => ({
  fonts: [],
  fontCategories: [],
  loading: false,
  error: null,
  setFonts: (fonts: Font[]) => set({ fonts }),
  setFontCategories: (categories: FontCategory[]) => set({ fontCategories: categories }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
}));