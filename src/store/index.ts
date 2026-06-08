import { create } from 'zustand';
import type { PasswordEntry, ModuleType, GeneratorOptions } from '@/types';
import { generateId } from '@/utils/crypto';
import { saveEntries } from '@/utils/storage';

interface AppState {
  isUnlocked: boolean;
  masterPassword: string;
  entries: PasswordEntry[];
  activeModule: ModuleType;
  searchQuery: string;
  categoryFilter: string;
  selectedEntry: PasswordEntry | null;
  isAddingEntry: boolean;
  failedAttempts: number;
  lockUntil: number | null;

  unlock: (masterPassword: string, entries: PasswordEntry[]) => void;
  lock: () => void;
  setActiveModule: (module: ModuleType) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  setSelectedEntry: (entry: PasswordEntry | null) => void;
  setIsAddingEntry: (value: boolean) => void;

  addEntry: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastUsedAt'>) => void;
  updateEntry: (id: string, updates: Partial<PasswordEntry>) => void;
  deleteEntry: (id: string) => void;
  useEntry: (id: string) => void;

  importEntries: (entries: PasswordEntry[]) => void;
  incrementFailedAttempt: () => void;
  resetFailedAttempts: () => void;
}

const defaultGeneratorOptions: GeneratorOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeSimilar: false,
};

interface GeneratorState {
  options: GeneratorOptions;
  generatedPassword: string;
  setOptions: (options: Partial<GeneratorOptions>) => void;
  setGeneratedPassword: (password: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isUnlocked: false,
  masterPassword: '',
  entries: [],
  activeModule: 'generator',
  searchQuery: '',
  categoryFilter: '',
  selectedEntry: null,
  isAddingEntry: false,
  failedAttempts: 0,
  lockUntil: null,

  unlock: (masterPassword, entries) => {
    set({
      isUnlocked: true,
      masterPassword,
      entries,
      failedAttempts: 0,
      lockUntil: null,
    });
  },

  lock: () => {
    set({
      isUnlocked: false,
      masterPassword: '',
      entries: [],
      selectedEntry: null,
      isAddingEntry: false,
      searchQuery: '',
      categoryFilter: '',
    });
  },

  setActiveModule: (module) => set({ activeModule: module }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setSelectedEntry: (entry) => set({ selectedEntry: entry }),
  setIsAddingEntry: (value) => set({ isAddingEntry: value }),

  addEntry: (entryData) => {
    const now = Date.now();
    const newEntry: PasswordEntry = {
      ...entryData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
    };
    const entries = [...get().entries, newEntry];
    set({ entries, isAddingEntry: false });
    saveEntries(entries, get().masterPassword);
  },

  updateEntry: (id, updates) => {
    const entries = get().entries.map((entry) =>
      entry.id === id
        ? { ...entry, ...updates, updatedAt: Date.now() }
        : entry
    );
    set({ entries });
    saveEntries(entries, get().masterPassword);
  },

  deleteEntry: (id) => {
    const entries = get().entries.filter((entry) => entry.id !== id);
    const selectedEntry = get().selectedEntry?.id === id ? null : get().selectedEntry;
    set({ entries, selectedEntry });
    saveEntries(entries, get().masterPassword);
  },

  useEntry: (id) => {
    const entries = get().entries.map((entry) =>
      entry.id === id ? { ...entry, lastUsedAt: Date.now() } : entry
    );
    set({ entries });
    saveEntries(entries, get().masterPassword);
  },

  importEntries: (importedEntries) => {
    const existingIds = new Set(get().entries.map((e) => e.id));
    const newEntries = importedEntries.filter((e) => !existingIds.has(e.id));
    const entries = [...get().entries, ...newEntries];
    set({ entries });
    saveEntries(entries, get().masterPassword);
  },

  incrementFailedAttempt: () => {
    const attempts = get().failedAttempts + 1;
    if (attempts >= 5) {
      set({ failedAttempts: attempts, lockUntil: Date.now() + 60000 });
    } else {
      set({ failedAttempts: attempts });
    }
  },

  resetFailedAttempts: () => {
    set({ failedAttempts: 0, lockUntil: null });
  },
}));

export const useGeneratorStore = create<GeneratorState>((set) => ({
  options: defaultGeneratorOptions,
  generatedPassword: '',
  setOptions: (newOptions) =>
    set((state) => ({
      options: { ...state.options, ...newOptions },
    })),
  setGeneratedPassword: (password) => set({ generatedPassword: password }),
}));
