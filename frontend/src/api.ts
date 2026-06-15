import axios from 'axios';
import type {
  LensItem, LipstickItem, BlushItem, OutfitItem,
  LookSuggestion, SavedLook, ChecklistItem, GeneratedChecklist, Stats, SceneType
} from './types';

const api = axios.create({ baseURL: '/api' });

export interface AllItems {
  lenses: LensItem[];
  lipsticks: LipstickItem[];
  blushes: BlushItem[];
  outfits: OutfitItem[];
}

export const itemsApi = {
  getAll: () => api.get<AllItems>('/items').then(r => r.data),
  addLens: (data: Omit<LensItem, 'id' | 'category' | 'createdAt'>) =>
    api.post<LensItem>('/items/lens', data).then(r => r.data),
  addLipstick: (data: Omit<LipstickItem, 'id' | 'category' | 'createdAt'>) =>
    api.post<LipstickItem>('/items/lipstick', data).then(r => r.data),
  addBlush: (data: Omit<BlushItem, 'id' | 'category' | 'createdAt'>) =>
    api.post<BlushItem>('/items/blush', data).then(r => r.data),
  addOutfit: (data: Omit<OutfitItem, 'id' | 'category' | 'createdAt'>) =>
    api.post<OutfitItem>('/items/outfit', data).then(r => r.data),
  updateLens: (id: string, data: Partial<LensItem>) =>
    api.put<LensItem>(`/items/lens/${id}`, data).then(r => r.data),
  updateLipstick: (id: string, data: Partial<LipstickItem>) =>
    api.put<LipstickItem>(`/items/lipstick/${id}`, data).then(r => r.data),
  updateBlush: (id: string, data: Partial<BlushItem>) =>
    api.put<BlushItem>(`/items/blush/${id}`, data).then(r => r.data),
  updateOutfit: (id: string, data: Partial<OutfitItem>) =>
    api.put<OutfitItem>(`/items/outfit/${id}`, data).then(r => r.data),
  delete: (category: string, id: string) =>
    api.delete(`/items/${category}/${id}`).then(r => r.data),
};

export const suggestApi = {
  generate: (scene: SceneType) =>
    api.get<LookSuggestion[]>(`/suggest?scene=${scene}`).then(r => r.data),
};

export const savedLooksApi = {
  getAll: (scene?: SceneType) =>
    api.get<SavedLook[]>('/saved-looks' + (scene ? `?scene=${scene}` : '')).then(r => r.data),
  save: (data: Omit<SavedLook, 'id' | 'savedAt' | 'useCount'>) =>
    api.post<SavedLook>('/saved-looks', data).then(r => r.data),
  update: (id: string, data: Partial<SavedLook>) =>
    api.put<SavedLook>(`/saved-looks/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/saved-looks/${id}`).then(r => r.data),
};

export const checklistApi = {
  getTemplates: () =>
    api.get<ChecklistItem[]>('/checklist-templates').then(r => r.data),
  getAll: () =>
    api.get<GeneratedChecklist[]>('/checklists').then(r => r.data),
  get: (id: string) =>
    api.get<GeneratedChecklist>(`/checklists/${id}`).then(r => r.data),
  create: (data: Omit<GeneratedChecklist, 'id' | 'createdAt'>) =>
    api.post<GeneratedChecklist>('/checklists', data).then(r => r.data),
  update: (id: string, data: Partial<GeneratedChecklist>) =>
    api.put<GeneratedChecklist>(`/checklists/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/checklists/${id}`).then(r => r.data),
  complete: (id: string) =>
    api.post<{ ok: boolean; missedItems: string[] }>(`/checklists/${id}/complete`).then(r => r.data),
};

export const statsApi = {
  get: () => api.get<Stats>('/stats').then(r => r.data),
};