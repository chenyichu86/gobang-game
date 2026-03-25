import { create } from 'zustand';

interface UIState {
  currentPage: string;
  soundEnabled: boolean;

  // Actions
  setCurrentPage: (page: string) => void;
  toggleSound: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentPage: '/',
  soundEnabled: true,

  setCurrentPage: (page) => set({ currentPage: page }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
}));
