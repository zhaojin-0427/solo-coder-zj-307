export type ItemCategory = 'lens' | 'lipstick' | 'blush' | 'outfit';

export type SceneType = 'commute' | 'date' | 'photo' | 'travel';

export type LensType = 'daily' | 'monthly' | 'yearly';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type RiskType = 'expiring_soon' | 'expired' | 'low_stock' | 'long_unused';

export interface InventoryInfo {
  stockStatus?: StockStatus;
  purchaseDate?: string;
  openDate?: string;
  shelfLifeDays?: number;
  remainingQuantity?: number;
  storageLocation?: string;
  isEssential?: boolean;
  lastUsedAt?: string;
}

export interface LensItem extends InventoryInfo {
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

export interface LipstickItem extends InventoryInfo {
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

export interface BlushItem extends InventoryInfo {
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

export interface OutfitItem extends InventoryInfo {
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

export interface ItemRiskInfo {
  risks: RiskType[];
  expiryDate?: string;
  daysUntilExpiry?: number;
  daysSinceLastUse?: number;
}

export type MakeupItem = LensItem | LipstickItem | BlushItem | OutfitItem;

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

export interface UsageRecord {
  id: string;
  lookId?: string;
  savedLookId?: string;
  scene: SceneType;
  items: OutfitCombination;
  checklistId?: string;
  missedItems: string[];
  usedAt: string;
}

export interface Review {
  id: string;
  checklistId: string;
  lookId?: string;
  scene: SceneType;
  comfortScore: number;
  makeupDurabilityScore: number;
  sceneFitScore: number;
  photoQualityScore: number;
  notes: string;
  nextReminderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LookReviewSummary {
  lookId: string;
  averageScore: number;
  reviewCount: number;
  latestReview?: Review;
}

export interface ReviewStats {
  scoreTrend: { date: string; averageScore: number; count: number }[];
  lowScoreKeywords: { keyword: string; count: number }[];
  upcomingReminders: { review: Review; checklist?: GeneratedChecklist; look?: SavedLook }[];
}

export interface InventoryStats {
  totalItems: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  longUnusedCount: number;
  essentialCount: number;
  healthScore: number;
}

export interface RiskItem {
  id: string;
  category: ItemCategory;
  name: string;
  brand?: string;
  risks: RiskType[];
  daysUntilExpiry?: number;
  expiryDate?: string;
  remainingQuantity?: number;
  daysSinceLastUse?: number;
  priority: number;
}

export interface Stats {
  topCombinations: { combination: OutfitCombination; count: number }[];
  sceneDistribution: { scene: SceneType; count: number; percentage: number }[];
  missedItemsRank: { itemName: string; count: number }[];
  styleReuseRate: { style: string; totalUsed: number; uniqueLooks: number; reuseRate: number }[];
  totalLooks: number;
  totalChecklists: number;
  reviewStats: ReviewStats;
  inventoryStats: InventoryStats;
  expiringSoonItems: RiskItem[];
  restockPriority: RiskItem[];
  longUnusedItems: RiskItem[];
}