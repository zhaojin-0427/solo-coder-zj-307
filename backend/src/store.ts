import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import type {
  LensItem, LipstickItem, BlushItem, OutfitItem, MakeupItem,
  LookSuggestion, SavedLook, GeneratedChecklist, ChecklistItem, UsageRecord
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
}

const DATA_FILE = path.join(__dirname, '..', 'data.json');

function loadData(): DataStore {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return getDefaultData();
    }
  }
  const data = getDefaultData();
  saveData(data);
  return data;
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