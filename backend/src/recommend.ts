import { v4 as uuidv4 } from 'uuid';
import type { SceneType, LensItem, LipstickItem, BlushItem, OutfitItem, LookSuggestion, OutfitCombination, UsageRecord, Stats, ReviewStats, RiskType, MakeupItem } from './types';

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

function getItemRisks(item: MakeupItem): { risks: RiskType[]; scorePenalty: number } {
  const risks: RiskType[] = [];
  let scorePenalty = 0;
  const now = new Date();

  const shelfLifeDays = getShelfLifeDays(item);
  const startDate = item.openDate || item.purchaseDate;

  if (startDate && shelfLifeDays) {
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + shelfLifeDays);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      risks.push('expired');
      scorePenalty += 0.8;
    } else if (daysUntilExpiry <= EXPIRING_SOON_DAYS) {
      risks.push('expiring_soon');
      scorePenalty += 0.3 + (EXPIRING_SOON_DAYS - daysUntilExpiry) / EXPIRING_SOON_DAYS * 0.3;
    }
  }

  if (item.stockStatus === 'out_of_stock' || item.remainingQuantity === 0) {
    risks.push('low_stock');
    scorePenalty += 0.9;
  } else if (item.stockStatus === 'low_stock' || (item.remainingQuantity !== undefined && item.remainingQuantity <= LOW_STOCK_THRESHOLD)) {
    risks.push('low_stock');
    scorePenalty += 0.4;
  }

  const lastUsed = item.lastUsedAt || item.createdAt;
  if (lastUsed) {
    const lastUsedDate = new Date(lastUsed);
    const daysSinceLastUse = Math.floor((now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastUse >= LONG_UNUSED_DAYS) {
      risks.push('long_unused');
      scorePenalty += 0.2;
    }
  }

  return { risks, scorePenalty: Math.min(scorePenalty, 0.95) };
}

const sceneStyles: Record<SceneType, string[]> = {
  commute: ['通勤', '自然', '职业', '低调'],
  date: ['约会', '甜美', '温柔', '精致'],
  photo: ['拍照', '混血', '复古', '酷', '精致'],
  travel: ['旅行', '自然', '清新', '活力'],
};

const sceneDescriptions: Record<SceneType, string[]> = {
  commute: ['日常通勤look，简洁不失精致', '元气通勤，让工作好心情', '低调优雅的办公室风格'],
  date: ['甜蜜约会，温柔可人', '心动的约会妆容', '甜美满分的约会风格'],
  photo: ['镜头感十足的出片妆容', '复古画报风', '混血感满满的街拍look'],
  travel: ['旅行好心情，活力满满', '清新自然旅行妆', '舒适又上镜的旅行风格'],
};

function matchScore(itemStyles: string[], scene: SceneType): number {
  const target = sceneStyles[scene];
  if (!itemStyles || itemStyles.length === 0) return 0.3;
  let score = 0;
  for (const s of itemStyles) {
    if (target.includes(s)) score += 1;
  }
  return score / target.length;
}

function pickBest<T extends { style: string[] } & MakeupItem>(items: T[], scene: SceneType): T | undefined {
  if (items.length === 0) return undefined;
  let best: T | undefined;
  let bestScore = -1;
  for (const item of items) {
    const baseScore = matchScore(item.style, scene);
    const { scorePenalty } = getItemRisks(item);
    const adjustedScore = baseScore * (1 - scorePenalty);
    if (adjustedScore > bestScore) { bestScore = adjustedScore; best = item; }
  }
  return best;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateSuggestions(
  lenses: LensItem[],
  lipsticks: LipstickItem[],
  blushes: BlushItem[],
  outfits: OutfitItem[],
  scene: SceneType,
  count: number = 5
): LookSuggestion[] {
  const suggestions: LookSuggestion[] = [];
  const descriptions = sceneDescriptions[scene];

  const baseLens = pickBest(lenses, scene);
  const baseLip = pickBest(lipsticks, scene);
  const baseBlush = pickBest(blushes, scene);
  const baseOutfit = pickBest(outfits, scene);

  // Top suggestion - all best matches
  suggestions.push(buildSuggestion(scene, {
    lensId: baseLens?.id,
    lipstickId: baseLip?.id,
    blushId: baseBlush?.id,
    outfitId: baseOutfit?.id,
  }, lenses, lipsticks, blushes, outfits, descriptions, 0));

  // Variations
  const lensPool = shuffle(lenses).slice(0, Math.min(lenses.length, 3));
  const lipPool = shuffle(lipsticks).slice(0, Math.min(lipsticks.length, 3));
  const blushPool = shuffle(blushes).slice(0, Math.min(blushes.length, 3));
  const outfitPool = shuffle(outfits).slice(0, Math.min(outfits.length, 3));

  for (let i = 0; i < count - 1; i++) {
    const lens = lensPool[i % lensPool.length] || baseLens;
    const lip = lipPool[i % lipPool.length] || baseLip;
    const blush = blushPool[i % blushPool.length] || baseBlush;
    const outfit = outfitPool[i % outfitPool.length] || baseOutfit;
    const combo = {
      lensId: lens?.id,
      lipstickId: lip?.id,
      blushId: blush?.id,
      outfitId: outfit?.id,
    };
    suggestions.push(buildSuggestion(scene, combo, lenses, lipsticks, blushes, outfits, descriptions, i + 1));
  }

  return suggestions;
}

function buildSuggestion(
  scene: SceneType,
  items: OutfitCombination,
  lenses: LensItem[], lipsticks: LipstickItem[], blushes: BlushItem[], outfits: OutfitItem[],
  descriptions: string[],
  index: number
): LookSuggestion {
  const lens = lenses.find(l => l.id === items.lensId);
  const lip = lipsticks.find(l => l.id === items.lipstickId);
  const blush = blushes.find(b => b.id === items.blushId);
  const outfit = outfits.find(o => o.id === items.outfitId);

  let score = 0;
  let totalPenalty = 0;
  const allStyles: string[] = [];
  let itemCount = 0;

  if (lens) {
    score += matchScore(lens.style, scene);
    totalPenalty += getItemRisks(lens).scorePenalty;
    allStyles.push(...lens.style);
    itemCount++;
  }
  if (lip) {
    score += matchScore(lip.style, scene);
    totalPenalty += getItemRisks(lip).scorePenalty;
    allStyles.push(...lip.style);
    itemCount++;
  }
  if (blush) {
    score += matchScore(blush.style, scene);
    totalPenalty += getItemRisks(blush).scorePenalty;
    allStyles.push(...blush.style);
    itemCount++;
  }
  if (outfit) {
    score += matchScore(outfit.style, scene);
    totalPenalty += getItemRisks(outfit).scorePenalty;
    allStyles.push(...outfit.style);
    itemCount++;
  }

  const avgScore = score / 4;
  const avgPenalty = itemCount > 0 ? totalPenalty / itemCount : 0;
  const finalScore = avgScore * (1 - avgPenalty * 0.5);

  const styleSet = Array.from(new Set(allStyles)).slice(0, 5);

  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name: `${sceneName(scene)}方案${index + 1}`,
    scene,
    items,
    description: descriptions[index % descriptions.length],
    style: styleSet,
    score: Math.round(finalScore * 100) / 100,
    createdAt: now,
  };
}

function sceneName(s: SceneType): string {
  const m: Record<SceneType, string> = { commute: '通勤', date: '约会', photo: '拍照', travel: '旅行' };
  return m[s];
}

export function computeStats(records: UsageRecord[], reviewStats: ReviewStats): Stats {
  const comboCount = new Map<string, { combination: OutfitCombination; count: number }>();
  const sceneCount = new Map<SceneType, number>();
  const missedCount = new Map<string, number>();
  const styleTotal = new Map<string, number>();
  const styleLooks = new Map<string, Set<string>>();

  for (const record of records) {
    sceneCount.set(record.scene, (sceneCount.get(record.scene) || 0) + 1);

    const key = JSON.stringify(record.items);
    const existing = comboCount.get(key);
    if (existing) existing.count++;
    else comboCount.set(key, { combination: record.items, count: 1 });

    for (const m of record.missedItems) {
      missedCount.set(m, (missedCount.get(m) || 0) + 1);
    }
  }

  const totalRecords = records.length;
  const topCombinations = Array.from(comboCount.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const sceneList: SceneType[] = ['commute', 'date', 'photo', 'travel'];
  const sceneDistribution = sceneList.map(scene => {
    const count = sceneCount.get(scene) || 0;
    return { scene, count, percentage: totalRecords ? Math.round((count / totalRecords) * 10000) / 100 : 0 };
  }).sort((a, b) => b.count - a.count);

  const missedItemsRank = Array.from(missedCount.entries())
    .map(([itemName, count]) => ({ itemName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    topCombinations,
    sceneDistribution,
    missedItemsRank,
    styleReuseRate: [],
    totalLooks: totalRecords,
    totalChecklists: records.filter(r => r.checklistId).length,
    reviewStats,
    inventoryStats: {
      totalItems: 0,
      inStockCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      expiringSoonCount: 0,
      expiredCount: 0,
      longUnusedCount: 0,
      essentialCount: 0,
      healthScore: 100,
    },
    expiringSoonItems: [],
    restockPriority: [],
    longUnusedItems: [],
  };
}

export function computeStatsWithLooks(records: UsageRecord[], lookGetter: (id: string) => { style: string[] } | undefined, reviewStats: ReviewStats): Stats {
  const base = computeStats(records, reviewStats);
  const styleTotal = new Map<string, number>();
  const styleLooks = new Map<string, Set<string>>();

  for (const record of records) {
    let styles: string[] = [];
    if (record.savedLookId) {
      const look = lookGetter(record.savedLookId);
      if (look) styles = look.style;
    }
    if (styles.length === 0) styles = ['未标注风格'];

    for (const s of styles) {
      styleTotal.set(s, (styleTotal.get(s) || 0) + 1);
      if (!styleLooks.has(s)) styleLooks.set(s, new Set());
      if (record.savedLookId) styleLooks.get(s)!.add(record.savedLookId);
      else styleLooks.get(s)!.add(record.id);
    }
  }

  const styleReuseRate = Array.from(styleTotal.entries()).map(([style, totalUsed]) => {
    const uniqueLooks = styleLooks.get(style)?.size || 1;
    return { style, totalUsed, uniqueLooks, reuseRate: Math.round((totalUsed / uniqueLooks) * 100) / 100 };
  }).sort((a, b) => b.reuseRate - a.reuseRate);

  return { ...base, styleReuseRate };
}