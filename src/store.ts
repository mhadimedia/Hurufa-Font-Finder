import { create } from 'zustand';
import { Font } from './types';

interface StoreState {
  fonts: Font[];
  tags: string[];
  addFont: (font: string) => void;
  removeFont: (font: string) => void;
  updateFontTags: (font: string, newTags: string[]) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  fonts: [],
  tags: [],
  
  addFont: (font) => 
    set((state) => {
      if (!state.fonts.some((f) => f.name === font)) {
        return {
          fonts: [...state.fonts, { name: font, tags: [] }],
        };
      }
      return state;
    }),

  removeFont: (font) =>
    set((state) => ({
      fonts: state.fonts.filter((f) => f.name !== font),
    })),

  updateFontTags: (font, newTags) =>
    set((state) => {
      const updatedFonts = state.fonts.map((f) =>
        f.name === font ? { ...f, tags: newTags } : f
      );
      
      // Extract unique tags from all fonts
      const allTags = new Set<string>();
      updatedFonts.forEach((f) => f.tags.forEach((tag) => allTags.add(tag)));
      
      return {
        fonts: updatedFonts,
        tags: Array.from(allTags),
      };
    }),

  addTag: (tag) =>
    set((state) => ({
      tags: [...new Set([...state.tags, tag])],
    })),

  removeTag: (tag) =>
    set((state) => ({
      tags: state.tags.filter((t) => t !== tag),
      fonts: state.fonts.map((font) => ({
        ...font,
        tags: font.tags.filter((t) => t !== tag),
      })),
    })),
}));