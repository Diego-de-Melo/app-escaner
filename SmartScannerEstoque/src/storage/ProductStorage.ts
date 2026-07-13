import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedList, Product, ExtractedLabelData, ProductFormData } from '../types/Product';

const SETTINGS_KEY = 'settings';
const SAVED_LISTS_KEY = 'savedLists';

export interface AppSettings {
  defaultUnit: string;
  defaultLocation: string;
  autoIncrementQuantity: boolean;
  scanSoundEnabled: boolean;
  vibrationEnabled: boolean;
  openAIKey: string;
  openAIModel: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultUnit: 'UN',
  defaultLocation: 'Estoque Principal',
  autoIncrementQuantity: true,
  scanSoundEnabled: true,
  vibrationEnabled: true,
  openAIKey: '',
  openAIModel: 'gpt-4o-mini',
};

let settingsCache: AppSettings | null = null;

async function loadSettings(): Promise<AppSettings> {
  if (settingsCache !== null) return settingsCache;
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    const parsed: AppSettings = data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    settingsCache = parsed;
    return parsed;
  } catch {
    settingsCache = DEFAULT_SETTINGS;
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(settings: AppSettings): Promise<void> {
  settingsCache = settings;
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export const settingsStorage = {
  async get(): Promise<AppSettings> {
    return loadSettings();
  },

  async set(settings: Partial<AppSettings>): Promise<void> {
    const current = await loadSettings();
    await saveSettings({ ...current, ...settings });
  },

  async reset(): Promise<void> {
    settingsCache = null;
    await AsyncStorage.removeItem(SETTINGS_KEY);
  },
};

// --- Saved Lists Storage ---

let savedListsCache: SavedList[] | null = null;

async function loadSavedLists(): Promise<SavedList[]> {
  if (savedListsCache !== null) return savedListsCache;
  try {
    const data = await AsyncStorage.getItem(SAVED_LISTS_KEY);
    savedListsCache = data ? JSON.parse(data) : [];
    return savedListsCache!;
  } catch {
    savedListsCache = [];
    return savedListsCache;
  }
}

async function persistSavedLists(lists: SavedList[]): Promise<void> {
  savedListsCache = lists;
  await AsyncStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(lists));
}

export const savedListStorage = {
  async getAll(): Promise<SavedList[]> {
    return loadSavedLists();
  },

  async getById(id: string): Promise<SavedList | null> {
    const lists = await loadSavedLists();
    return lists.find(l => l.id === id) || null;
  },

  async save(name: string, products: Product[]): Promise<SavedList> {
    const lists = await loadSavedLists();
    const now = new Date().toISOString();
    const newList: SavedList = {
      id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name,
      products,
      createdAt: now,
      updatedAt: now,
    };
    lists.push(newList);
    await persistSavedLists(lists);
    return newList;
  },

  async updateProducts(id: string, products: Product[]): Promise<void> {
    const lists = await loadSavedLists();
    const index = lists.findIndex(l => l.id === id);
    if (index >= 0) {
      lists[index] = { ...lists[index], products, updatedAt: new Date().toISOString() };
      await persistSavedLists(lists);
    }
  },

  async updateName(id: string, name: string): Promise<void> {
    const lists = await loadSavedLists();
    const index = lists.findIndex(l => l.id === id);
    if (index >= 0) {
      lists[index] = { ...lists[index], name, updatedAt: new Date().toISOString() };
      await persistSavedLists(lists);
    }
  },

  async delete(id: string): Promise<void> {
    const lists = await loadSavedLists();
    await persistSavedLists(lists.filter(l => l.id !== id));
  },

  async getProductCount(id: string): Promise<number> {
    const list = await loadSavedLists();
    const found = list.find(l => l.id === id);
    return found ? found.products.length : 0;
  },
};

// --- Helpers ---

const generateCodeHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const generateProductCode = (data: ExtractedLabelData | ProductFormData): string => {
  const str = `${data.description}|${data.model}|${data.color}|${data.voltage}`.toLowerCase();
  const hash = generateCodeHash(str);
  return `PRD${hash.toString(36).toUpperCase()}`;
};

export type { ProductFormData } from '../types/Product';
