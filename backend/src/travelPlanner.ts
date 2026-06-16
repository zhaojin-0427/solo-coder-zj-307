import { v4 as uuidv4 } from 'uuid';
import type {
  TravelPlan, TravelChecklist, PackingListItem, DailyChecklist,
  DailyOutfit, ItemCategory, LensItem, LipstickItem, BlushItem, OutfitItem,
  ItemRiskInfo
} from './types';

interface ItemLookup {
  findLens: (id: string) => LensItem | undefined;
  findLipstick: (id: string) => LipstickItem | undefined;
  findBlush: (id: string) => BlushItem | undefined;
  findOutfit: (id: string) => OutfitItem | undefined;
  getRiskInfo: (item: any) => ItemRiskInfo;
}

function findItemById(
  id: string,
  category: ItemCategory,
  lookup: ItemLookup
): LensItem | LipstickItem | BlushItem | OutfitItem | undefined {
  switch (category) {
    case 'lens': return lookup.findLens(id);
    case 'lipstick': return lookup.findLipstick(id);
    case 'blush': return lookup.findBlush(id);
    case 'outfit': return lookup.findOutfit(id);
  }
}

function buildMakeupPackingItem(
  id: string,
  category: ItemCategory,
  name: string,
  quantity: number,
  riskInfo: ItemRiskInfo,
  remainingQuantity?: number
): PackingListItem {
  const isLowStock = remainingQuantity !== undefined && remainingQuantity < quantity;
  const isExpiring = riskInfo.risks.includes('expiring_soon') || riskInfo.risks.includes('expired');
  return {
    id: uuidv4(),
    name,
    category: 'item',
    essential: true,
    itemId: id,
    itemCategory: category,
    quantity,
    isLowStock,
    isExpiring,
  };
}

export function generateTravelChecklist(
  plan: TravelPlan,
  lookup: ItemLookup
): TravelChecklist {
  const warnings: string[] = [];
  const dailyChecklists: DailyChecklist[] = [];

  const itemUsageMap = new Map<string, { category: ItemCategory; name: string; days: Set<number>; remainingQty?: number; riskInfo: ItemRiskInfo }>();
  const hasDailyLens = new Set<string>();
  const hasMonthlyLens = new Set<string>();

  for (const outfit of plan.dailyOutfits) {
    const dayItems: PackingListItem[] = [];
    const { items, dayIndex } = outfit;

    function processItem(id: string | undefined, category: ItemCategory) {
      if (!id) return;
      const item = findItemById(id, category, lookup);
      if (!item) return;

      const riskInfo = lookup.getRiskInfo(item);
      const key = `${category}:${id}`;
      const existing = itemUsageMap.get(key);
      if (existing) {
        existing.days.add(dayIndex);
      } else {
        itemUsageMap.set(key, {
          category,
          name: item.name,
          days: new Set([dayIndex]),
          remainingQty: item.remainingQuantity,
          riskInfo,
        });
      }

      if (category === 'lens') {
        const lens = item as LensItem;
        if (lens.lensType === 'daily') hasDailyLens.add(id);
        else hasMonthlyLens.add(id);
      }

      const dayQty = category === 'lens' && (item as LensItem).lensType === 'daily' ? 1 : 1;
      dayItems.push({
        id: uuidv4(),
        name: item.name,
        category: 'item',
        essential: true,
        itemId: id,
        itemCategory: category,
        quantity: dayQty,
        isLowStock: riskInfo.risks.includes('low_stock'),
        isExpiring: riskInfo.risks.includes('expiring_soon') || riskInfo.risks.includes('expired'),
      });
    }

    processItem(items.lensId, 'lens');
    processItem(items.lipstickId, 'lipstick');
    processItem(items.blushId, 'blush');
    processItem(items.outfitId, 'outfit');

    dailyChecklists.push({ dayIndex, items: dayItems });
  }

  const totalItems: PackingListItem[] = [];

  for (const [key, info] of itemUsageMap.entries()) {
    const [category, id] = key.split(':');
    const daysUsed = info.days.size;
    let quantity = 1;

    if (category === 'lens') {
      const lens = lookup.findLens(id);
      if (lens) {
        quantity = lens.lensType === 'daily' ? daysUsed : 1;
      }
    } else {
      quantity = 1;
    }

    const item = buildMakeupPackingItem(
      id,
      category as ItemCategory,
      info.name,
      quantity,
      info.riskInfo,
      info.remainingQty
    );
    totalItems.push(item);

    if (item.isLowStock) {
      warnings.push(`库存预警: ${info.name} 数量可能不足，建议备货 ${quantity} 件`);
    }
    if (item.isExpiring) {
      warnings.push(`有效期预警: ${info.name} 即将过期或已过期`);
    }
  }

  function addCareItem(name: string, essential: boolean = true, note?: string, quantity?: number) {
    const existing = totalItems.find(i => i.category === 'care' && i.name === name);
    if (existing) {
      if (quantity !== undefined) {
        existing.quantity = Math.max(existing.quantity || 1, quantity);
      }
      return;
    }
    totalItems.push({
      id: uuidv4(),
      name,
      category: 'care',
      essential,
      quantity,
      note,
    });
  }

  function addMakeupItem(name: string, essential: boolean = false, note?: string, quantity?: number) {
    const existing = totalItems.find(i => i.category === 'makeup' && i.name === name);
    if (existing) {
      if (quantity !== undefined) {
        existing.quantity = Math.max(existing.quantity || 1, quantity);
      }
      return;
    }
    totalItems.push({
      id: uuidv4(),
      name,
      category: 'makeup',
      essential,
      quantity,
      note,
    });
  }

  function addAccessoryItem(name: string, essential: boolean = false, note?: string, quantity?: number) {
    const existing = totalItems.find(i => i.category === 'accessory' && i.name === name);
    if (existing) {
      if (quantity !== undefined) {
        existing.quantity = Math.max(existing.quantity || 1, quantity);
      }
      return;
    }
    totalItems.push({
      id: uuidv4(),
      name,
      category: 'accessory',
      essential,
      quantity,
      note,
    });
  }

  if (hasDailyLens.size > 0 || hasMonthlyLens.size > 0) {
    addCareItem('美瞳护理液', true, '非日抛必备', hasMonthlyLens.size > 0 ? 1 : undefined);
    addCareItem('隐形眼镜盒', true, '建议额外备用1个', 2);

    if (hasDailyLens.size > 0) {
      const totalDailyNeeded = Array.from(hasDailyLens).reduce((sum, id) => {
        const key = `lens:${id}`;
        const info = itemUsageMap.get(key);
        return sum + (info?.days.size || 0);
      }, 0);
      addCareItem('美瞳日抛备用', false, `建议额外备${Math.ceil(totalDailyNeeded * 0.3)}片`, Math.ceil(totalDailyNeeded * 0.3));
    }

    addCareItem('润眼液', false);
    addAccessoryItem('备用框架眼镜', false);
  }

  const travelDays = plan.days;
  addMakeupItem('粉饼/气垫', false, '控油补妆必备');
  addMakeupItem('镜子', false);
  addMakeupItem('吸油纸', false, undefined, Math.ceil(travelDays / 3));
  addMakeupItem('口红补妆', false, '可选常用色号替换装');

  addCareItem('卸妆湿巾', true, undefined, Math.ceil(travelDays / 2));
  addCareItem('替换装', false, '口红/气垫等替换装');

  if (travelDays >= 5) {
    warnings.push(`长途旅行提醒(${travelDays}天): 建议检查所有物品库存是否充足`);
  }

  if (hasDailyLens.size === 0 && hasMonthlyLens.size === 0) {
    warnings.push('未安排美瞳，如需要请手动添加');
  }

  return {
    totalItems,
    dailyChecklists,
    warnings,
  };
}
