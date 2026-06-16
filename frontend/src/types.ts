export type ItemCategory = 'lens' | 'lipstick' | 'blush' | 'outfit';
export type SceneType = 'commute' | 'date' | 'photo' | 'travel';
export type LensType = 'daily' | 'monthly' | 'yearly';

export interface LensItem {
  id: string;
  category: 'lens';
  name: string;
  brand: string;
  color: string;
  diameter: number;
  lensType: LensType;
  style: string[];
  notes?: string;
  createdAt: string;
}

export interface LipstickItem {
  id: string;
  category: 'lipstick';
  name: string;
  brand: string;
  color: string;
  finish: string;
  style: string[];
  notes?: string;
  createdAt: string;
}

export interface BlushItem {
  id: string;
  category: 'blush';
  name: string;
  brand: string;
  color: string;
  texture: string;
  style: string[];
  notes?: string;
  createdAt: string;
}

export interface OutfitItem {
  id: string;
  category: 'outfit';
  name: string;
  type: string;
  color: string;
  style: string[];
  season: string[];
  notes?: string;
  createdAt: string;
}

export interface OutfitCombination {
  lensId?: string;
  lipstickId?: string;
  blushId?: string;
  outfitId?: string;
}

export interface LookSuggestion {
  id: string;
  name: string;
  scene: SceneType;
  items: OutfitCombination;
  description: string;
  style: string[];
  score: number;
  createdAt: string;
}

export interface SavedLook {
  id: string;
  suggestionId?: string;
  name: string;
  scene: SceneType;
  items: OutfitCombination;
  description: string;
  style: string[];
  savedAt: string;
  useCount: number;
}

export interface ChecklistItem {
  id: string;
  name: string;
  category: 'care' | 'makeup' | 'accessory' | 'other';
  essential: boolean;
  relatedLensId?: string;
}

export interface GeneratedChecklist {
  id: string;
  lookId?: string;
  scene: SceneType;
  items: { checklistItemId: string; checked: boolean }[];
  createdAt: string;
  completedAt?: string;
}

export interface Stats {
  topCombinations: { combination: OutfitCombination; count: number }[];
  sceneDistribution: { scene: SceneType; count: number; percentage: number }[];
  missedItemsRank: { itemName: string; count: number }[];
  styleReuseRate: { style: string; totalUsed: number; uniqueLooks: number; reuseRate: number }[];
  totalLooks: number;
  totalChecklists: number;
}

export const SceneLabels: Record<SceneType, string> = {
  commute: '通勤',
  date: '约会',
  photo: '拍照',
  travel: '旅行',
};

export const CategoryLabels: Record<ItemCategory, string> = {
  lens: '美瞳',
  lipstick: '口红',
  blush: '腮红',
  outfit: '服饰',
};

export interface AllItems {
  lenses: LensItem[];
  lipsticks: LipstickItem[];
  blushes: BlushItem[];
  outfits: OutfitItem[];
}