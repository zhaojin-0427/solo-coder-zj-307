import { Router, Request, Response } from 'express';
import {
  getAllItems, addLens, addLipstick, addBlush, addOutfit,
  updateLens, updateLipstick, updateBlush, updateOutfit, deleteItem,
  getSuggestions, addSuggestions,
  getSavedLooks, saveLook, updateSavedLook, deleteSavedLook, incrementSavedLookUse, getSavedLookById,
  getChecklistTemplates, getChecklists, createChecklist, updateChecklist, deleteChecklist, getChecklistById,
  addUsageRecord, getUsageRecords,
  getReviews, getReviewById, getReviewByChecklistId, getReviewsByLookId, getReviewsByScene,
  createReview, updateReview, deleteReview, getLookReviewSummary, getAllLookReviewSummaries, getReviewStats,
  getAllItemsWithRisk, getItemRiskInfo, getInventoryStats, updateItemLastUsed,
  getTravelPlans, getTravelPlanById, createTravelPlan, updateTravelPlan, deleteTravelPlan,
  computeTravelStats,
} from './store';
import { generateSuggestions, computeStatsWithLooks, generateTravelOutfits } from './recommend';
import { generateTravelChecklist } from './travelPlanner';
import type { SceneType, SavedLook, GeneratedChecklist, Review, OutfitCombination, TravelPlan, DailyScene } from './types';

const router = Router();

// Items
router.get('/items', (_req: Request, res: Response) => {
  res.json(getAllItems());
});

router.get('/items/with-risk', (_req: Request, res: Response) => {
  res.json(getAllItemsWithRisk());
});

router.get('/inventory/stats', (_req: Request, res: Response) => {
  res.json(getInventoryStats());
});

router.post('/items/lens', (req: Request, res: Response) => {
  const item = addLens(req.body);
  res.status(201).json(item);
});
router.post('/items/lipstick', (req: Request, res: Response) => {
  const item = addLipstick(req.body);
  res.status(201).json(item);
});
router.post('/items/blush', (req: Request, res: Response) => {
  const item = addBlush(req.body);
  res.status(201).json(item);
});
router.post('/items/outfit', (req: Request, res: Response) => {
  const item = addOutfit(req.body);
  res.status(201).json(item);
});

router.put('/items/lens/:id', (req: Request, res: Response) => {
  const item = updateLens(req.params.id, req.body);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});
router.put('/items/lipstick/:id', (req: Request, res: Response) => {
  const item = updateLipstick(req.params.id, req.body);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});
router.put('/items/blush/:id', (req: Request, res: Response) => {
  const item = updateBlush(req.params.id, req.body);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});
router.put('/items/outfit/:id', (req: Request, res: Response) => {
  const item = updateOutfit(req.params.id, req.body);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.delete('/items/:category/:id', (req: Request, res: Response) => {
  const ok = deleteItem(req.params.category, req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// Recommendations
router.get('/suggest', (req: Request, res: Response) => {
  const scene = req.query.scene as SceneType;
  if (!scene || !['commute', 'date', 'photo', 'travel'].includes(scene)) {
    return res.status(400).json({ error: 'Invalid scene' });
  }
  const { lenses, lipsticks, blushes, outfits } = getAllItems();
  const suggestions = generateSuggestions(lenses, lipsticks, blushes, outfits, scene, 5);
  addSuggestions(suggestions);
  res.json(suggestions);
});

router.get('/suggestions', (req: Request, res: Response) => {
  const scene = req.query.scene as string | undefined;
  res.json(getSuggestions(scene));
});

// Saved Looks
router.get('/saved-looks', (req: Request, res: Response) => {
  const scene = req.query.scene as string | undefined;
  res.json(getSavedLooks(scene));
});

router.post('/saved-looks', (req: Request, res: Response) => {
  const body = req.body as Omit<SavedLook, 'id' | 'savedAt' | 'useCount'>;
  if (!body.name || !body.scene) return res.status(400).json({ error: 'Missing fields' });
  const saved = saveLook(body);
  res.status(201).json(saved);
});

router.put('/saved-looks/:id', (req: Request, res: Response) => {
  const item = updateSavedLook(req.params.id, req.body);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.delete('/saved-looks/:id', (req: Request, res: Response) => {
  const ok = deleteSavedLook(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// Checklist Templates
router.get('/checklist-templates', (_req: Request, res: Response) => {
  res.json(getChecklistTemplates());
});

// Generated Checklists
router.get('/checklists', (_req: Request, res: Response) => {
  res.json(getChecklists());
});

router.get('/checklists/:id', (req: Request, res: Response) => {
  const c = getChecklistById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json(c);
});

router.post('/checklists', (req: Request, res: Response) => {
  const body = req.body as Omit<GeneratedChecklist, 'id' | 'createdAt'>;
  if (!body.scene) return res.status(400).json({ error: 'Missing scene' });
  const checklist = createChecklist(body);
  res.status(201).json(checklist);
});

router.put('/checklists/:id', (req: Request, res: Response) => {
  const item = updateChecklist(req.params.id, req.body);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.delete('/checklists/:id', (req: Request, res: Response) => {
  const ok = deleteChecklist(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// Complete checklist - record usage
router.post('/checklists/:id/complete', (req: Request, res: Response) => {
  const checklist = getChecklistById(req.params.id);
  if (!checklist) return res.status(404).json({ error: 'Not found' });

  const templates = getChecklistTemplates();
  const missedItems: string[] = [];
  for (const ci of checklist.items) {
    if (!ci.checked) {
      const t = templates.find(tt => tt.id === ci.checklistItemId);
      if (t) missedItems.push(t.name);
    }
  }

  updateChecklist(checklist.id, { completedAt: new Date().toISOString() });

  // Get the look if present
  let lookStyle: string[] = [];
  let lookItems = {};
  if (checklist.lookId) {
    const look = getSavedLookById(checklist.lookId);
    if (look) {
      lookStyle = look.style;
      lookItems = look.items;
      incrementSavedLookUse(checklist.lookId);
    }
  }

  const items = lookItems as OutfitCombination;

  // Update last used time for items in the look
  if (items.lensId) updateItemLastUsed('lens', items.lensId);
  if (items.lipstickId) updateItemLastUsed('lipstick', items.lipstickId);
  if (items.blushId) updateItemLastUsed('blush', items.blushId);
  if (items.outfitId) updateItemLastUsed('outfit', items.outfitId);

  addUsageRecord({
    lookId: checklist.lookId,
    savedLookId: checklist.lookId,
    scene: checklist.scene,
    items,
    checklistId: checklist.id,
    missedItems,
  });

  res.json({ ok: true, missedItems });
});

// Stats
router.get('/stats', (_req: Request, res: Response) => {
  const records = getUsageRecords();
  const reviewStats = getReviewStats();
  const inventoryStats = getInventoryStats();
  const travelStats = computeTravelStats();
  const stats = computeStatsWithLooks(records, (id) => {
    const look = getSavedLookById(id);
    return look ? { style: look.style } : undefined;
  }, reviewStats);
  res.json({
    ...stats,
    inventoryStats: {
      totalItems: inventoryStats.totalItems,
      inStockCount: inventoryStats.inStockCount,
      lowStockCount: inventoryStats.lowStockCount,
      outOfStockCount: inventoryStats.outOfStockCount,
      expiringSoonCount: inventoryStats.expiringSoonCount,
      expiredCount: inventoryStats.expiredCount,
      longUnusedCount: inventoryStats.longUnusedCount,
      essentialCount: inventoryStats.essentialCount,
      healthScore: inventoryStats.healthScore,
    },
    expiringSoonItems: inventoryStats.expiringSoonItems,
    restockPriority: inventoryStats.restockPriority,
    longUnusedItems: inventoryStats.longUnusedItems,
    travelStats,
  });
});

// Reviews
router.get('/reviews', (req: Request, res: Response) => {
  const lookId = req.query.lookId as string | undefined;
  const scene = req.query.scene as string | undefined;
  if (lookId) {
    res.json(getReviewsByLookId(lookId));
  } else if (scene) {
    res.json(getReviewsByScene(scene));
  } else {
    res.json(getReviews());
  }
});

router.get('/reviews/:id', (req: Request, res: Response) => {
  const r = getReviewById(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json(r);
});

router.get('/reviews/checklist/:checklistId', (req: Request, res: Response) => {
  const r = getReviewByChecklistId(req.params.checklistId);
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json(r);
});

router.get('/reviews/summaries/looks', (_req: Request, res: Response) => {
  res.json(getAllLookReviewSummaries());
});

router.get('/reviews/summary/look/:lookId', (req: Request, res: Response) => {
  res.json(getLookReviewSummary(req.params.lookId));
});

router.post('/reviews', (req: Request, res: Response) => {
  const body = req.body as Omit<Review, 'id' | 'createdAt' | 'updatedAt'>;
  if (!body.checklistId) return res.status(400).json({ error: '缺少清单ID' });
  if (body.comfortScore === undefined || body.makeupDurabilityScore === undefined ||
      body.sceneFitScore === undefined || body.photoQualityScore === undefined) {
    return res.status(400).json({ error: '缺少评分项' });
  }
  const result = createReview(body);
  if ('error' in result) return res.status(400).json({ error: result.error });
  res.status(201).json(result);
});

router.put('/reviews/:id', (req: Request, res: Response) => {
  const result = updateReview(req.params.id, req.body);
  if ('error' in result) return res.status(400).json({ error: result.error });
  res.json(result);
});

router.delete('/reviews/:id', (req: Request, res: Response) => {
  const ok = deleteReview(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// Travel Plans
router.get('/travel-plans', (_req: Request, res: Response) => {
  res.json(getTravelPlans());
});

router.get('/travel-plans/:id', (req: Request, res: Response) => {
  const plan = getTravelPlanById(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Not found' });
  res.json(plan);
});

router.post('/travel-plans', (req: Request, res: Response) => {
  const body = req.body as Partial<TravelPlan> & { name: string; destination: string; startDate: string; endDate: string; days: number; dailyScenes: DailyScene[] };
  if (!body.name || !body.destination || !body.startDate || !body.endDate || body.days === undefined) {
    return res.status(400).json({ error: '缺少必填字段: name, destination, startDate, endDate, days' });
  }

  const { lenses, lipsticks, blushes, outfits } = getAllItems();
  const reviewSummaries = getAllLookReviewSummaries();
  const savedLooks = getSavedLooks();
  const dailyScenes = body.dailyScenes || [];
  const dailyOutfits = generateTravelOutfits(
    { lenses, lipsticks, blushes, outfits },
    dailyScenes,
    body.days,
    reviewSummaries,
    savedLooks
  );

  const plan = createTravelPlan({
    ...body,
    dailyScenes,
    dailyOutfits,
  });
  res.status(201).json(plan);
});

router.post('/travel-plans/:id/generate-outfits', (req: Request, res: Response) => {
  const plan = getTravelPlanById(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Not found' });

  const { lenses, lipsticks, blushes, outfits } = getAllItems();
  const reviewSummaries = getAllLookReviewSummaries();
  const savedLooks = getSavedLooks();
  const dailyScenes = (req.body.dailyScenes as DailyScene[]) || plan.dailyScenes;
  const days = (req.body.days as number) || plan.days;

  const newOutfits = generateTravelOutfits(
    { lenses, lipsticks, blushes, outfits },
    dailyScenes,
    days,
    reviewSummaries,
    savedLooks
  );

  const lockedMap = new Map<number, string[]>();
  for (const outfit of plan.dailyOutfits) {
    if (outfit.lockedIds && outfit.lockedIds.length > 0) {
      lockedMap.set(outfit.dayIndex, outfit.lockedIds);
    }
  }

  const mergedOutfits = newOutfits.map(outfit => {
    const lockedIds = lockedMap.get(outfit.dayIndex) || [];
    const original = plan.dailyOutfits.find(o => o.dayIndex === outfit.dayIndex);
    const mergedItems = { ...outfit.items };
    if (original) {
      for (const lockedId of lockedIds) {
        if (original.items.lensId === lockedId) mergedItems.lensId = lockedId;
        if (original.items.lipstickId === lockedId) mergedItems.lipstickId = lockedId;
        if (original.items.blushId === lockedId) mergedItems.blushId = lockedId;
        if (original.items.outfitId === lockedId) mergedItems.outfitId = lockedId;
      }
    }
    return {
      ...outfit,
      items: mergedItems,
      lockedIds,
    };
  });

  const updated = updateTravelPlan(plan.id, { dailyOutfits: mergedOutfits, dailyScenes, days });
  res.json(updated);
});

router.put('/travel-plans/:id', (req: Request, res: Response) => {
  const updated = updateTravelPlan(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

router.post('/travel-plans/:id/confirm', (req: Request, res: Response) => {
  const plan = getTravelPlanById(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Not found' });

  const { lenses, lipsticks, blushes, outfits } = getAllItems();

  const checklist = generateTravelChecklist(plan, {
    findLens: (id) => lenses.find(l => l.id === id),
    findLipstick: (id) => lipsticks.find(l => l.id === id),
    findBlush: (id) => blushes.find(b => b.id === id),
    findOutfit: (id) => outfits.find(o => o.id === id),
    getRiskInfo: (item) => getItemRiskInfo(item),
  });

  const updated = updateTravelPlan(plan.id, {
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
    checklist,
    dailyChecklists: checklist.dailyChecklists,
    warnings: checklist.warnings,
  });
  res.json(updated);
});

router.post('/travel-plans/:id/complete', (req: Request, res: Response) => {
  const plan = getTravelPlanById(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Not found' });

  for (const outfit of plan.dailyOutfits) {
    const items = outfit.items;
    if (items.lensId) updateItemLastUsed('lens', items.lensId);
    if (items.lipstickId) updateItemLastUsed('lipstick', items.lipstickId);
    if (items.blushId) updateItemLastUsed('blush', items.blushId);
    if (items.outfitId) updateItemLastUsed('outfit', items.outfitId);

    addUsageRecord({
      scene: 'travel',
      items,
      missedItems: req.body.missedItems || [],
    });
  }

  const updated = updateTravelPlan(plan.id, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  });
  res.json(updated);
});

router.delete('/travel-plans/:id', (req: Request, res: Response) => {
  const ok = deleteTravelPlan(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

export default router;