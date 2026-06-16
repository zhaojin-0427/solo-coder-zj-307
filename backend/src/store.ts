import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import type {
  LensItem, LipstickItem, BlushItem, OutfitItem, MakeupItem,
  LookSuggestion, SavedLook, GeneratedChecklist, ChecklistItem, UsageRecord,
  Review, LookReviewSummary, ReviewStats, SceneType,
  ItemRiskInfo, RiskType, ItemCategory, InventoryStats, RiskItem
} from './types';

interface DataStore {
  lenses: LensItem[];
  lipsticks: LipstickItem[];
  blushes: BlushItem[];
  outfits: OutfitItem[];
  suggestions: LookSuggestion[];
  savedLooks: SavedLook[];
  checklistTemplates: ChecklistItem[];
  checklists: GeneratedChecklist[];
  usageRecords: UsageRecord[];
  reviews: Review[];
}

const DATA_FILE = path.join(__dirname, '..', 'data.json');

function loadData(): DataStore {
  const defaultData = getDefaultData();
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        lenses: parsed.lenses || defaultData.lenses,
        lipsticks: parsed.lipsticks || defaultData.lipsticks,
        blushes: parsed.blushes || defaultData.blushes,
        outfits: parsed.outfits || defaultData.outfits,
        suggestions: parsed.suggestions || defaultData.suggestions,
        savedLooks: parsed.savedLooks || defaultData.savedLooks,
        checklistTemplates: parsed.checklistTemplates || defaultData.checklistTemplates,
        checklists: parsed.checklists || defaultData.checklists,
        usageRecords: parsed.usageRecords || defaultData.usageRecords,
        reviews: parsed.reviews || defaultData.reviews,
      };
    } catch {
      return defaultData;
    }
  }
  saveData(defaultData);
  return defaultData;
}

function saveData(data: DataStore) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getDefaultData(): DataStore {
  const now = new Date().toISOString();
  return {
    lenses: [
      { id: uuidv4(), category: 'lens', name: '自然棕日抛', brand: '海昌', color: '棕色', diameter: 14.0, lensType: 'daily', style: ['自然', '通勤'], notes: '上班日常', createdAt: now },
      { id: uuidv4(), category: 'lens', name: '蜜糖棕月抛', brand: '博士伦', color: '蜜糖棕', diameter: 14.2, lensType: 'monthly', style: ['甜美', '约会'], notes: '约会用', createdAt: now },
      { id: uuidv4(), category: 'lens', name: '混血灰', brand: 'Givre', color: '灰色', diameter: 14.5, lensType: 'daily', style: ['混血', '拍照', '酷'], notes: '拍照出片', createdAt: now },
    ],
    lipsticks: [
      { id: uuidv4(), category: 'lipstick', name: '豆沙色', brand: 'NARS', color: '豆沙粉', finish: '哑光', style: ['自然', '通勤'], notes: '日常百搭', createdAt: now },
      { id: uuidv4(), category: 'lipstick', name: '草莓红', brand: 'Dior', color: '亮红', finish: '缎面', style: ['甜美', '约会'], createdAt: now },
      { id: uuidv4(), category: 'lipstick', name: '复古红棕', brand: 'MAC', color: '红棕', finish: '哑光', style: ['复古', '拍照', '酷'], createdAt: now },
    ],
    blushes: [
      { id: uuidv4(), category: 'blush', name: '蜜桃色', brand: 'CANMAKE', color: '蜜桃粉', texture: '粉状', style: ['自然', '通勤', '甜美'], createdAt: now },
      { id: uuidv4(), category: 'blush', name: '玫瑰粉', brand: 'NARS', color: '玫瑰粉', texture: '膏状', style: ['约会', '甜美'], createdAt: now },
      { id: uuidv4(), category: 'blush', name: '梅子色', brand: 'Benefit', color: '梅子紫', texture: '液态', style: ['酷', '拍照', '复古'], createdAt: now },
    ],
    outfits: [
      { id: uuidv4(), category: 'outfit', name: '白色衬衫+西装裤', type: '通勤套装', color: '白+灰', style: ['通勤', '职业'], season: ['春', '秋', '冬'], createdAt: now },
      { id: uuidv4(), category: 'outfit', name: '粉色连衣裙', type: '连衣裙', color: '粉色', style: ['甜美', '约会'], season: ['春', '夏'], createdAt: now },
      { id: uuidv4(), category: 'outfit', name: '黑色小礼服', type: '礼服', color: '黑色', style: ['复古', '拍照', '酷'], season: ['春', '夏', '秋', '冬'], createdAt: now },
      { id: uuidv4(), category: 'outfit', name: '休闲卫衣+牛仔裤', type: '休闲套装', color: '卫衣+蓝', style: ['旅行', '自然', '通勤'], season: ['春', '秋'], createdAt: now },
    ],
    suggestions: [],
    savedLooks: [],
    checklistTemplates: [
      { id: uuidv4(), name: '美瞳护理液', category: 'care', essential: true },
      { id: uuidv4(), name: '隐形眼镜盒', category: 'care', essential: true },
      { id: uuidv4(), name: '备用框架眼镜', category: 'accessory', essential: false },
      { id: uuidv4(), name: '润眼液', category: 'care', essential: false },
      { id: uuidv4(), name: '口红补妆', category: 'makeup', essential: false },
      { id: uuidv4(), name: '粉饼/气垫', category: 'makeup', essential: false },
      { id: uuidv4(), name: '镜子', category: 'accessory', essential: false },
      { id: uuidv4(), name: '吸油纸', category: 'makeup', essential: false },
      { id: uuidv4(), name: '美瞳日抛备用', category: 'care', essential: false },
      { id: uuidv4(), name: '卸妆湿巾', category: 'care', essential: false },
    ],
    checklists: [],
    usageRecords: [],
    reviews: [],
  };
}

let store: DataStore = loadData();

function persist() { saveData(store); }

// Items
export function getAllItems(): { lenses: LensItem[]; lipsticks: LipstickItem[]; blushes: BlushItem[]; outfits: OutfitItem[] } {
  return { lenses: store.lenses, lipsticks: store.lipsticks, blushes: store.blushes, outfits: store.outfits };
}

export function addLens(item: Omit<LensItem, 'id' | 'category' | 'createdAt'>): LensItem {
  const newItem: LensItem = { id: uuidv4(), category: 'lens', ...item, createdAt: new Date().toISOString() };
  store.lenses.push(newItem); persist(); return newItem;
}
export function addLipstick(item: Omit<LipstickItem, 'id' | 'category' | 'createdAt'>): LipstickItem {
  const newItem: LipstickItem = { id: uuidv4(), category: 'lipstick', ...item, createdAt: new Date().toISOString() };
  store.lipsticks.push(newItem); persist(); return newItem;
}
export function addBlush(item: Omit<BlushItem, 'id' | 'category' | 'createdAt'>): BlushItem {
  const newItem: BlushItem = { id: uuidv4(), category: 'blush', ...item, createdAt: new Date().toISOString() };
  store.blushes.push(newItem); persist(); return newItem;
}
export function addOutfit(item: Omit<OutfitItem, 'id' | 'category' | 'createdAt'>): OutfitItem {
  const newItem: OutfitItem = { id: uuidv4(), category: 'outfit', ...item, createdAt: new Date().toISOString() };
  store.outfits.push(newItem); persist(); return newItem;
}

export function updateLens(id: string, patch: Partial<LensItem>): LensItem | null {
  const idx = store.lenses.findIndex(i => i.id === id);
  if (idx === -1) return null;
  store.lenses[idx] = { ...store.lenses[idx], ...patch };
  persist(); return store.lenses[idx];
}
export function updateLipstick(id: string, patch: Partial<LipstickItem>): LipstickItem | null {
  const idx = store.lipsticks.findIndex(i => i.id === id);
  if (idx === -1) return null;
  store.lipsticks[idx] = { ...store.lipsticks[idx], ...patch };
  persist(); return store.lipsticks[idx];
}
export function updateBlush(id: string, patch: Partial<BlushItem>): BlushItem | null {
  const idx = store.blushes.findIndex(i => i.id === id);
  if (idx === -1) return null;
  store.blushes[idx] = { ...store.blushes[idx], ...patch };
  persist(); return store.blushes[idx];
}
export function updateOutfit(id: string, patch: Partial<OutfitItem>): OutfitItem | null {
  const idx = store.outfits.findIndex(i => i.id === id);
  if (idx === -1) return null;
  store.outfits[idx] = { ...store.outfits[idx], ...patch };
  persist(); return store.outfits[idx];
}

export function deleteItem(category: string, id: string): boolean {
  const map: Record<string, any[]> = { lens: store.lenses, lipstick: store.lipsticks, blush: store.blushes, outfit: store.outfits };
  const arr = map[category];
  if (!arr) return false;
  const idx = arr.findIndex((i: any) => i.id === id);
  if (idx === -1) return false;
  arr.splice(idx, 1); persist(); return true;
}

// Suggestions
export function addSuggestions(suggestions: LookSuggestion[]): LookSuggestion[] {
  store.suggestions = [...suggestions, ...store.suggestions];
  persist(); return suggestions;
}
export function getSuggestions(scene?: string): LookSuggestion[] {
  if (scene) return store.suggestions.filter(s => s.scene === scene);
  return store.suggestions;
}

// Saved Looks
export function getSavedLooks(scene?: string): SavedLook[] {
  if (scene) return store.savedLooks.filter(s => s.scene === scene);
  return store.savedLooks;
}
export function getSavedLookById(id: string): SavedLook | undefined {
  return store.savedLooks.find(s => s.id === id);
}
export function saveLook(look: Omit<SavedLook, 'id' | 'savedAt' | 'useCount'>): SavedLook {
  const newLook: SavedLook = { id: uuidv4(), ...look, savedAt: new Date().toISOString(), useCount: 0 };
  store.savedLooks.push(newLook); persist(); return newLook;
}
export function updateSavedLook(id: string, patch: Partial<SavedLook>): SavedLook | null {
  const idx = store.savedLooks.findIndex(s => s.id === id);
  if (idx === -1) return null;
  store.savedLooks[idx] = { ...store.savedLooks[idx], ...patch };
  persist(); return store.savedLooks[idx];
}
export function incrementSavedLookUse(id: string): SavedLook | null {
  return updateSavedLook(id, { useCount: (store.savedLooks.find(s => s.id === id)?.useCount || 0) + 1 });
}
export function deleteSavedLook(id: string): boolean {
  const idx = store.savedLooks.findIndex(s => s.id === id);
  if (idx === -1) return false;
  store.savedLooks.splice(idx, 1); persist(); return true;
}

// Checklist
export function getChecklistTemplates(): ChecklistItem[] { return store.checklistTemplates; }
export function getChecklists(): GeneratedChecklist[] { return store.checklists; }
export function getChecklistById(id: string): GeneratedChecklist | undefined {
  return store.checklists.find(c => c.id === id);
}
export function createChecklist(checklist: Omit<GeneratedChecklist, 'id' | 'createdAt'>): GeneratedChecklist {
  const newChecklist: GeneratedChecklist = { id: uuidv4(), ...checklist, createdAt: new Date().toISOString() };
  store.checklists.push(newChecklist); persist(); return newChecklist;
}
export function updateChecklist(id: string, patch: Partial<GeneratedChecklist>): GeneratedChecklist | null {
  const idx = store.checklists.findIndex(c => c.id === id);
  if (idx === -1) return null;
  store.checklists[idx] = { ...store.checklists[idx], ...patch };
  persist(); return store.checklists[idx];
}
export function deleteChecklist(id: string): boolean {
  const idx = store.checklists.findIndex(c => c.id === id);
  if (idx === -1) return false;
  store.checklists.splice(idx, 1); persist(); return true;
}

// Usage
export function addUsageRecord(record: Omit<UsageRecord, 'id' | 'usedAt'>): UsageRecord {
  const newRecord: UsageRecord = { id: uuidv4(), ...record, usedAt: new Date().toISOString() };
  store.usageRecords.push(newRecord); persist(); return newRecord;
}
export function getUsageRecords(): UsageRecord[] { return store.usageRecords; }

// Reviews
export function getReviews(): Review[] { return store.reviews; }

export function getReviewById(id: string): Review | undefined {
  return store.reviews.find(r => r.id === id);
}

export function getReviewByChecklistId(checklistId: string): Review | undefined {
  return store.reviews.find(r => r.checklistId === checklistId);
}

export function getReviewsByLookId(lookId: string): Review[] {
  return store.reviews.filter(r => r.lookId === lookId);
}

export function getReviewsByScene(scene: string): Review[] {
  return store.reviews.filter(r => r.scene === scene);
}

function validateScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 5;
}

const VALID_SCENES: SceneType[] = ['commute', 'date', 'photo', 'travel'];
function validateScene(scene: string): scene is SceneType {
  return VALID_SCENES.includes(scene as SceneType);
}

export function createReview(data: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Review | { error: string } {
  const checklist = getChecklistById(data.checklistId);
  if (!checklist) return { error: '清单不存在' };
  if (!checklist.completedAt) return { error: '未完成的清单不能创建复盘' };

  if (!validateScene(data.scene)) return { error: '场景值非法，必须为 commute/date/photo/travel 之一' };

  if (!validateScore(data.comfortScore)) return { error: '佩戴舒适度评分必须为 1-5 分' };
  if (!validateScore(data.makeupDurabilityScore)) return { error: '妆容持久度评分必须为 1-5 分' };
  if (!validateScore(data.sceneFitScore)) return { error: '场景适配度评分必须为 1-5 分' };
  if (!validateScore(data.photoQualityScore)) return { error: '照片出片度评分必须为 1-5 分' };

  const existing = getReviewByChecklistId(data.checklistId);
  if (existing) {
    return updateReview(existing.id, data);
  }

  const now = new Date().toISOString();
  const newReview: Review = {
    id: uuidv4(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  store.reviews.push(newReview);
  persist();
  return newReview;
}

export function updateReview(id: string, data: Partial<Omit<Review, 'id' | 'createdAt' | 'updatedAt'>>): Review | { error: string } {
  const idx = store.reviews.findIndex(r => r.id === id);
  if (idx === -1) return { error: '复盘记录不存在' };

  if (data.scene !== undefined && !validateScene(data.scene)) {
    return { error: '场景值非法，必须为 commute/date/photo/travel 之一' };
  }

  if (data.checklistId !== undefined) {
    const checklist = getChecklistById(data.checklistId);
    if (!checklist) return { error: '清单不存在' };
    if (!checklist.completedAt) return { error: '未完成的清单不能关联复盘' };
  }

  if (data.comfortScore !== undefined && !validateScore(data.comfortScore)) {
    return { error: '佩戴舒适度评分必须为 1-5 分' };
  }
  if (data.makeupDurabilityScore !== undefined && !validateScore(data.makeupDurabilityScore)) {
    return { error: '妆容持久度评分必须为 1-5 分' };
  }
  if (data.sceneFitScore !== undefined && !validateScore(data.sceneFitScore)) {
    return { error: '场景适配度评分必须为 1-5 分' };
  }
  if (data.photoQualityScore !== undefined && !validateScore(data.photoQualityScore)) {
    return { error: '照片出片度评分必须为 1-5 分' };
  }

  store.reviews[idx] = {
    ...store.reviews[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  persist();
  return store.reviews[idx];
}

export function deleteReview(id: string): boolean {
  const idx = store.reviews.findIndex(r => r.id === id);
  if (idx === -1) return false;
  store.reviews.splice(idx, 1);
  persist();
  return true;
}

export function getLookReviewSummary(lookId: string): LookReviewSummary {
  const reviews = getReviewsByLookId(lookId);
  if (reviews.length === 0) {
    return { lookId, averageScore: 0, reviewCount: 0 };
  }

  const avg = reviews.reduce((sum, r) => {
    const avgReview = (r.comfortScore + r.makeupDurabilityScore + r.sceneFitScore + r.photoQualityScore) / 4;
    return sum + avgReview;
  }, 0) / reviews.length;

  const latest = reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return {
    lookId,
    averageScore: Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
    latestReview: latest,
  };
}

export function getAllLookReviewSummaries(): LookReviewSummary[] {
  const lookIds = [...new Set(store.reviews.filter(r => r.lookId).map(r => r.lookId!))];
  return lookIds.map(id => getLookReviewSummary(id));
}

const LOW_SCORE_KEYWORDS = [
  '不舒服', '干', '痒', '磨眼', '滑片', '晕妆', '脱妆', '掉色', '卡粉',
  '浮粉', '不持久', '太浓', '太淡', '不合适', '奇怪', '尴尬', '累',
  '重', '紧', '闷', '热', '冷', '不方便', '麻烦', '忘带', '坏了',
  '过时', '老气', '幼稚', '便宜', '劣质', '过敏', '泛红', '刺痛',
];

export function getReviewStats(): ReviewStats {
  const reviews = getReviews();
  const today = new Date();

  const scoreMap = new Map<string, { total: number; count: number }>();
  reviews.forEach(r => {
    const date = new Date(r.createdAt).toLocaleDateString('zh-CN');
    const avg = (r.comfortScore + r.makeupDurabilityScore + r.sceneFitScore + r.photoQualityScore) / 4;
    const existing = scoreMap.get(date) || { total: 0, count: 0 };
    scoreMap.set(date, { total: existing.total + avg, count: existing.count + 1 });
  });

  const scoreTrend = Array.from(scoreMap.entries())
    .map(([date, data]) => ({
      date,
      averageScore: Math.round((data.total / data.count) * 10) / 10,
      count: data.count,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14);

  const keywordCount = new Map<string, number>();
  reviews.forEach(r => {
    const avg = (r.comfortScore + r.makeupDurabilityScore + r.sceneFitScore + r.photoQualityScore) / 4;
    if (avg <= 2.5 && r.notes) {
      LOW_SCORE_KEYWORDS.forEach(kw => {
        if (r.notes!.includes(kw)) {
          keywordCount.set(kw, (keywordCount.get(kw) || 0) + 1);
        }
      });
    }
  });

  const lowScoreKeywords = Array.from(keywordCount.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const upcomingReminders = reviews
    .filter(r => r.nextReminderDate)
    .filter(r => new Date(r.nextReminderDate!) >= today)
    .sort((a, b) => new Date(a.nextReminderDate!).getTime() - new Date(b.nextReminderDate!).getTime())
    .slice(0, 10)
    .map(r => ({
      review: r,
      checklist: getChecklistById(r.checklistId),
      look: r.lookId ? getSavedLookById(r.lookId) : undefined,
    }));

  return { scoreTrend, lowScoreKeywords, upcomingReminders };
}

const EXPIRING_SOON_DAYS = 30;
const LONG_UNUSED_DAYS = 90;
const LOW_STOCK_THRESHOLD = 3;

const LENS_SHELF_LIFE: Record<string, number> = {
  daily: 1,
  monthly: 30,
  yearly: 365,
};

const COSMETIC_SHELF_LIFE_DAYS = 365;

function getShelfLifeDays(item: MakeupItem): number | undefined {
  if (item.shelfLifeDays) return item.shelfLifeDays;
  if (item.category === 'lens') {
    return LENS_SHELF_LIFE[item.lensType];
  }
  if (item.category === 'lipstick' || item.category === 'blush') {
    return COSMETIC_SHELF_LIFE_DAYS;
  }
  return undefined;
}

export function getItemRiskInfo(item: MakeupItem): ItemRiskInfo {
  const risks: RiskType[] = [];
  const now = new Date();
  let expiryDate: Date | undefined;
  let daysUntilExpiry: number | undefined;
  let daysSinceLastUse: number | undefined;

  const shelfLifeDays = getShelfLifeDays(item);
  const startDate = item.openDate || item.purchaseDate;

  if (startDate && shelfLifeDays) {
    expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + shelfLifeDays);
    daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      risks.push('expired');
    } else if (daysUntilExpiry <= EXPIRING_SOON_DAYS) {
      risks.push('expiring_soon');
    }
  }

  if (item.stockStatus === 'low_stock' || item.stockStatus === 'out_of_stock') {
    risks.push('low_stock');
  } else if (item.remainingQuantity !== undefined && item.remainingQuantity <= LOW_STOCK_THRESHOLD) {
    risks.push('low_stock');
  }

  const lastUsed = item.lastUsedAt || item.createdAt;
  if (lastUsed) {
    const lastUsedDate = new Date(lastUsed);
    daysSinceLastUse = Math.floor((now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastUse >= LONG_UNUSED_DAYS) {
      risks.push('long_unused');
    }
  }

  return {
    risks,
    expiryDate: expiryDate?.toISOString(),
    daysUntilExpiry,
    daysSinceLastUse,
  };
}

export function getItemWithRisk(item: MakeupItem): MakeupItem & { riskInfo: ItemRiskInfo } {
  return { ...item, riskInfo: getItemRiskInfo(item) };
}

export function getAllItemsWithRisk(): {
  lenses: (LensItem & { riskInfo: ItemRiskInfo })[];
  lipsticks: (LipstickItem & { riskInfo: ItemRiskInfo })[];
  blushes: (BlushItem & { riskInfo: ItemRiskInfo })[];
  outfits: (OutfitItem & { riskInfo: ItemRiskInfo })[];
} {
  return {
    lenses: store.lenses.map(item => getItemWithRisk(item) as LensItem & { riskInfo: ItemRiskInfo }),
    lipsticks: store.lipsticks.map(item => getItemWithRisk(item) as LipstickItem & { riskInfo: ItemRiskInfo }),
    blushes: store.blushes.map(item => getItemWithRisk(item) as BlushItem & { riskInfo: ItemRiskInfo }),
    outfits: store.outfits.map(item => getItemWithRisk(item) as OutfitItem & { riskInfo: ItemRiskInfo }),
  };
}

function getAllItemsFlat(): MakeupItem[] {
  return [
    ...store.lenses,
    ...store.lipsticks,
    ...store.blushes,
    ...store.outfits,
  ];
}

function toRiskItem(item: MakeupItem, riskInfo: ItemRiskInfo): RiskItem {
  const priority = calculateRiskPriority(riskInfo.risks, riskInfo.daysUntilExpiry, riskInfo.daysSinceLastUse);
  return {
    id: item.id,
    category: item.category,
    name: item.name,
    brand: 'brand' in item ? (item as any).brand : undefined,
    risks: riskInfo.risks,
    daysUntilExpiry: riskInfo.daysUntilExpiry,
    expiryDate: riskInfo.expiryDate,
    remainingQuantity: item.remainingQuantity,
    daysSinceLastUse: riskInfo.daysSinceLastUse,
    priority,
  };
}

function calculateRiskPriority(risks: RiskType[], daysUntilExpiry?: number, daysSinceLastUse?: number): number {
  let priority = 0;
  if (risks.includes('expired')) priority += 100;
  if (risks.includes('low_stock')) priority += 80;
  if (risks.includes('expiring_soon')) {
    priority += 60;
    if (daysUntilExpiry !== undefined) {
      priority += Math.max(0, 30 - daysUntilExpiry);
    }
  }
  if (risks.includes('long_unused')) {
    priority += 40;
    if (daysSinceLastUse !== undefined) {
      priority += Math.min(60, daysSinceLastUse - 90);
    }
  }
  return priority;
}

export function getInventoryStats(): InventoryStats & {
  expiringSoonItems: RiskItem[];
  restockPriority: RiskItem[];
  longUnusedItems: RiskItem[];
} {
  const allItems = getAllItemsFlat();
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let expiringSoonCount = 0;
  let expiredCount = 0;
  let longUnusedCount = 0;
  let essentialCount = 0;

  const expiringSoonList: RiskItem[] = [];
  const restockList: RiskItem[] = [];
  const longUnusedList: RiskItem[] = [];

  for (const item of allItems) {
    const riskInfo = getItemRiskInfo(item);
    const riskItem = toRiskItem(item, riskInfo);

    if (item.stockStatus === 'in_stock' || (!item.stockStatus && (item.remainingQuantity === undefined || item.remainingQuantity > LOW_STOCK_THRESHOLD))) {
      inStockCount++;
    } else if (item.stockStatus === 'low_stock' || (item.remainingQuantity !== undefined && item.remainingQuantity > 0 && item.remainingQuantity <= LOW_STOCK_THRESHOLD)) {
      lowStockCount++;
    } else if (item.stockStatus === 'out_of_stock' || item.remainingQuantity === 0) {
      outOfStockCount++;
    }

    if (riskInfo.risks.includes('expiring_soon')) {
      expiringSoonCount++;
      expiringSoonList.push(riskItem);
    }
    if (riskInfo.risks.includes('expired')) {
      expiredCount++;
    }
    if (riskInfo.risks.includes('long_unused')) {
      longUnusedCount++;
      longUnusedList.push(riskItem);
    }
    if (riskInfo.risks.includes('low_stock')) {
      restockList.push(riskItem);
    }
    if (item.isEssential) {
      essentialCount++;
    }
  }

  const totalItems = allItems.length;
  const healthyItems = inStockCount - expiringSoonCount - expiredCount - longUnusedCount;
  const healthScore = totalItems > 0 ? Math.round((healthyItems / totalItems) * 100) : 100;

  expiringSoonList.sort((a, b) => (a.daysUntilExpiry || 999) - (b.daysUntilExpiry || 999));
  restockList.sort((a, b) => b.priority - a.priority);
  longUnusedList.sort((a, b) => (b.daysSinceLastUse || 0) - (a.daysSinceLastUse || 0));

  return {
    totalItems,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    expiringSoonCount,
    expiredCount,
    longUnusedCount,
    essentialCount,
    healthScore,
    expiringSoonItems: expiringSoonList.slice(0, 10),
    restockPriority: restockList.slice(0, 10),
    longUnusedItems: longUnusedList.slice(0, 10),
  };
}

export function updateItemLastUsed(category: ItemCategory, id: string): boolean {
  const map: Record<string, any[]> = { lens: store.lenses, lipstick: store.lipsticks, blush: store.blushes, outfit: store.outfits };
  const arr = map[category];
  if (!arr) return false;
  const idx = arr.findIndex((i: any) => i.id === id);
  if (idx === -1) return false;
  arr[idx] = { ...arr[idx], lastUsedAt: new Date().toISOString() };
  persist();
  return true;
}