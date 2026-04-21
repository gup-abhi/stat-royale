import { create } from 'zustand';
import { SavedPlayer } from '../../../shared/types';
import { getSavedPlayersApi, savePlayerApi, deleteSavedPlayerApi } from '../api/savedPlayers.api';

interface SavedPlayersState {
  saved: SavedPlayer[];
  isLoading: boolean;
  fetch: () => Promise<void>;
  save: (playerTag: string) => Promise<void>;
  remove: (playerTag: string) => Promise<void>;
  isSaved: (playerTag: string) => boolean;
}

export const useSavedPlayersStore = create<SavedPlayersState>((set, get) => ({
  saved: [],
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const saved = await getSavedPlayersApi();
      set({ saved });
    } finally {
      set({ isLoading: false });
    }
  },

  save: async (playerTag: string) => {
    const entry = await savePlayerApi(playerTag);
    set((s) => ({ saved: [entry, ...s.saved.filter((p) => p.playerTag !== playerTag)] }));
  },

  remove: async (playerTag: string) => {
    await deleteSavedPlayerApi(playerTag);
    set((s) => ({ saved: s.saved.filter((p) => p.playerTag !== playerTag) }));
  },

  isSaved: (playerTag: string) => {
    const norm = playerTag.trim().toUpperCase().replace(/^#/, '');
    return get().saved.some((p) => p.playerTag === norm);
  },
}));
