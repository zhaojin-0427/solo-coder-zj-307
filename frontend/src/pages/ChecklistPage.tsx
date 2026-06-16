import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { checklistApi, savedLooksApi, itemsApi, reviewApi } from '../api';
import type { GeneratedChecklist, ChecklistItem, SceneType, AllItems, SavedLook, Review } from '../types';
import { SceneLabels } from '../types';

const CAT_LABEL: Record<string, { name: string; color: string }> = {
  care: { name: '隐形护理', color: 'pink' },
  makeup: { name: '补妆用品', color: 'purple' },
  accessory: { name: '随身配件', color: 'blue' },
  other: { name: '其他物品', color: 'green' },
};

const SCORE_LABELS: Record<string, string> = {
  comfortScore: '佩戴舒适度',
  makeupDurabilityScore: '妆容持久度',
  sceneFitScore: '场景适配度',
  photoQualityScore: '照片出片度',
};

function StarRating({ value, onChange, disabled }: { value: number; onChange?: (v: number) => void; disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          onClick={() => !disabled && onChange && onChange(s)}
          style={{
            fontSize: 24,
            cursor: disabled ? 'default' : 'pointer',
            color: s <= value ? '#f59e0b' : '#d1d5db',
            transition: 'all 0.2s',
            transform: !disabled && s <= value ? 'scale(1.1)' : 'none',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ChecklistPage() {
  const location = useLocation();
  const locationState = location.state as { newChecklistId?: string } | null;
  const [checklists, setChecklists] = useState<GeneratedChecklist[]>([]);
  const [templates, setTemplates] = useState<ChecklistItem[]>([]);
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [items, setItems] = useState<AllItems | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newScene, setNewScene] = useState<SceneType>('commute');
  const [newLookId, setNewLookId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const hasInitialLoaded = useRef(false);
  const lastLocationKey = useRef<string>('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reviewForm, setReviewForm] = useState({
    comfortScore: 5,
    makeupDurabilityScore: 5,
    sceneFitScore: 5,
    photoQualityScore: 5,
    notes: '',
    nextReminderDate: '',
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const load = async (highlightId?: string) => {
    setLoading(true);
    try {
      const [c, t, l, i, r] = await Promise.all([
        checklistApi.getAll(),
        checklistApi.getTemplates(),
        savedLooksApi.getAll(),
        itemsApi.getAll(),
        reviewApi.getAll(),
      ]);
      setChecklists(c);
      setTemplates(t);
      setLooks(l);
      setItems(i);
      setReviews(r);

      const targetId = highlightId || locationState?.newChecklistId;
      if (targetId && c.some(cl => cl.id === targetId)) {
        setSelectedId(targetId);
      } else if (selectedId && c.some(cl => cl.id === selectedId)) {
        // 保持当前选中
      } else if (c.length > 0) {
        setSelectedId(c[0].id);
      } else {
        setSelectedId(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReviewForChecklist = async (checklistId: string) => {
    setReviewLoading(true);
    try {
      const review = await reviewApi.getByChecklistId(checklistId);
      setReviews(prev => {
        const idx = prev.findIndex(r => r.id === review.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = review;
          return copy;
        }
        return [...prev, review];
      });
    } catch (e) {
      // 404 means no review exists - that's fine
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    load();
    hasInitialLoaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId) {
      const selected = checklists.find(c => c.id === selectedId);
      if (selected?.completedAt) {
        loadReviewForChecklist(selectedId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const openReviewForm = (existing?: Review) => {
    if (existing) {
      setEditingReview(existing);
      setReviewForm({
        comfortScore: existing.comfortScore,
        makeupDurabilityScore: existing.makeupDurabilityScore,
        sceneFitScore: existing.sceneFitScore,
        photoQualityScore: existing.photoQualityScore,
        notes: existing.notes,
        nextReminderDate: existing.nextReminderDate ? existing.nextReminderDate.split('T')[0] : '',
      });
    } else {
      setEditingReview(null);
      setReviewForm({
        comfortScore: 5,
        makeupDurabilityScore: 5,
        sceneFitScore: 5,
        photoQualityScore: 5,
        notes: '',
        nextReminderDate: '',
      });
    }
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selected) return;
    setReviewSubmitting(true);
    try {
      const payload = {
        checklistId: selected.id,
        lookId: selected.lookId,
        scene: selected.scene,
        ...reviewForm,
        nextReminderDate: reviewForm.nextReminderDate || undefined,
      };
      let result: Review;
      if (editingReview) {
        result = await reviewApi.update(editingReview.id, payload);
      } else {
        result = await reviewApi.create(payload);
      }
      setReviews(prev => {
        const idx = prev.findIndex(r => r.id === result.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = result;
          return copy;
        }
        return [...prev, result];
      });
      setShowReviewModal(false);
      alert(editingReview ? '✅ 复盘已更新！' : '✅ 复盘已保存！');
    } catch (e: any) {
      alert(e?.response?.data?.error || '保存失败，请重试');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getAverageScore = (r: Review) => {
    return ((r.comfortScore + r.makeupDurabilityScore + r.sceneFitScore + r.photoQualityScore) / 4).toFixed(1);
  };

  useEffect(() => {
    if (!hasInitialLoaded.current) return;
    const newId = locationState?.newChecklistId;
    if (newId && newId !== selectedId) {
      if (checklists.some(c => c.id === newId)) {
        setSelectedId(newId);
      } else {
        load(newId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const selected = checklists.find(c => c.id === selectedId) || null;
  const selectedLook = selected?.lookId ? looks.find(l => l.id === selected.lookId) : undefined;
  const selectedReview = selected?.id ? reviews.find(r => r.checklistId === selected.id) : undefined;

  const getTemplate = (id: string) => templates.find(t => t.id === id);

  const handleToggle = async (itemIdx: number) => {
    if (!selected) return;
    const newItems = [...selected.items];
    newItems[itemIdx] = { ...newItems[itemIdx], checked: !newItems[itemIdx].checked };
    const updated = await checklistApi.update(selected.id, { items: newItems });
    setChecklists(checklists.map(c => c.id === selected.id ? updated : c));
  };

  const handleComplete = async () => {
    if (!selected) return;
    if (!confirm('确认完成出门清单？这将记录你的使用情况和遗漏物品。')) return;
    try {
      const result = await checklistApi.complete(selected.id);
      const message = result.missedItems.length > 0
        ? `✅ 已记录！遗漏物品：${result.missedItems.join('、')}`
        : '🎉 太棒了！所有物品都已带齐！';
      if (confirm(`${message}\n\n是否立即为本次搭配创建复盘？`)) {
        await load();
        setTimeout(() => openReviewForm(), 300);
      } else {
        load();
      }
    } catch (e) {
      alert('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该清单？')) return;
    await checklistApi.delete(id);
    if (selectedId === id) setSelectedId(null);
    load();
  };

  const handleCreate = async () => {
    const items = templates.map(t => ({ checklistItemId: t.id, checked: !t.essential }));
    const payload: any = { scene: newScene, items };
    if (newLookId) payload.lookId = newLookId;
    const created = await checklistApi.create(payload);
    setShowCreate(false);
    load(created.id);
  };

  const findItem = (id?: string, category: 'lens' | 'lipstick' | 'blush' | 'outfit' = 'lens') => {
    if (!id || !items) return null;
    const map: any = { lens: items.lenses, lipstick: items.lipsticks, blush: items.blushes, outfit: items.outfits };
    return map[category].find((i: any) => i.id === id);
  };

  // Group items by category
  const groupedItems = selected ? (() => {
    const g: Record<string, { tpl: ChecklistItem; checked: boolean; idx: number }[]> = {};
    selected.items.forEach((ci, idx) => {
      const tpl = getTemplate(ci.checklistItemId);
      if (!tpl) return;
      if (!g[tpl.category]) g[tpl.category] = [];
      g[tpl.category].push({ tpl, checked: ci.checked, idx });
    });
    return g;
  })() : {};

  const checkedCount = selected ? selected.items.filter(i => i.checked).length : 0;
  const totalCount = selected ? selected.items.length : 0;
  const progress = totalCount ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div>
      <div className="section-header">
        <h1 className="page-title">📋 出门清单</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 新建清单</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* 左侧清单列表 */}
        <div>
          <div className="card" style={{ padding: 12, maxHeight: 600, overflowY: 'auto' }}>
            <div style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600, color: '#374151' }}>历史清单</div>
            {checklists.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                暂无清单，点击右上角创建
              </div>
            )}
            {checklists.map(c => {
              const look = c.lookId ? looks.find(l => l.id === c.lookId) : undefined;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: selectedId === c.id ? 'linear-gradient(135deg, #fdf2f8, #f5f3ff)' : 'transparent',
                    border: selectedId === c.id ? '1px solid rgba(219,39,119,0.2)' : '1px solid transparent',
                    marginBottom: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
                      {SceneLabels[c.scene]}
                      {c.completedAt && <span style={{ marginLeft: 6, fontSize: 11, color: '#059669' }}>✓已完成</span>}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                      style={{ padding: '2px 6px', fontSize: 11 }}
                    >✕</button>
                  </div>
                  {look && <div style={{ fontSize: 12, color: '#8b5cf6', marginTop: 4 }}>⭐ {look.name}</div>}
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                    {new Date(c.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧详情 */}
        <div>
          {!selected && (
            <div className="empty">
              <div className="emoji">📋</div>
              <p>选择或创建一份出门清单</p>
            </div>
          )}

          {selected && (
            <div>
              {/* 进度条 */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{SceneLabels[selected.scene]}出门清单</div>
                    {selectedLook && (
                      <div style={{ fontSize: 13, color: '#8b5cf6', marginTop: 4 }}>
                        搭配方案：⭐ {selectedLook.name}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, background: 'linear-gradient(135deg, #db2777, #8b5cf6)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                      {progress}%
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{checkedCount}/{totalCount} 已确认</div>
                  </div>
                </div>
                <div style={{ height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #db2777, #8b5cf6)', borderRadius: 5, transition: 'width 0.3s' }}></div>
                </div>
                {selectedLook && (
                  <div style={{ marginTop: 16, padding: 14, background: '#fafafa', borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>今日搭配：</div>
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.9 }}>
                      👁️ {findItem(selectedLook.items.lensId, 'lens')?.name || '-'}　
                      💄 {findItem(selectedLook.items.lipstickId, 'lipstick')?.name || '-'}　
                      🌸 {findItem(selectedLook.items.blushId, 'blush')?.name || '-'}　
                      👗 {findItem(selectedLook.items.outfitId, 'outfit')?.name || '-'}
                    </div>
                  </div>
                )}
                {!selected.completedAt && (
                  <div style={{ marginTop: 16 }}>
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleComplete}>
                      ✅ 确认出门，记录清单
                    </button>
                  </div>
                )}
                {selected.completedAt && (
                  <div style={{ marginTop: 16, padding: 14, background: '#d1fae5', borderRadius: 10, textAlign: 'center', fontSize: 13, color: '#047857' }}>
                    🎉 本清单已完成于 {new Date(selected.completedAt).toLocaleString('zh-CN')}
                  </div>
                )}
                {selected.completedAt && (
                  <div style={{ marginTop: 16 }}>
                    {reviewLoading ? (
                      <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>加载复盘中...</div>
                    ) : (
                      <>
                        {selectedReview ? (
                          <div style={{ padding: 16, background: 'linear-gradient(135deg, #fef3c7, #fce7f3)', borderRadius: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>📝 本次复盘</div>
                              <button className="btn btn-secondary btn-sm" onClick={() => openReviewForm(selectedReview)}>
                                ✏️ 编辑复盘
                              </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 12, padding: '10px 0', background: 'rgba(255,255,255,0.5)', borderRadius: 8 }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#db2777' }}>⭐ {getAverageScore(selectedReview)}</div>
                                <div style={{ fontSize: 11, color: '#6b7280' }}>综合评分</div>
                              </div>
                              {(['comfortScore', 'makeupDurabilityScore', 'sceneFitScore', 'photoQualityScore'] as const).map(key => (
                                <div key={key} style={{ textAlign: 'center' }}>
                                  <StarRating value={(selectedReview as any)[key]} disabled />
                                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{SCORE_LABELS[key]}</div>
                                </div>
                              ))}
                            </div>
                            {selectedReview.notes && (
                              <div style={{ fontSize: 12, color: '#78350f', marginBottom: 8, lineHeight: 1.6 }}>
                                <span style={{ fontWeight: 600 }}>备注：</span>{selectedReview.notes}
                              </div>
                            )}
                            {selectedReview.nextReminderDate && (
                              <div style={{ fontSize: 12, color: '#047857' }}>
                                <span style={{ fontWeight: 600 }}>⏰ 下次提醒：</span>
                                {new Date(selectedReview.nextReminderDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                              </div>
                            )}
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, textAlign: 'right' }}>
                              创建于 {new Date(selectedReview.createdAt).toLocaleString('zh-CN')}
                            </div>
                          </div>
                        ) : (
                          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => openReviewForm()}>
                            📝 为本次搭配创建复盘
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 分类清单 */}
              {Object.entries(groupedItems).map(([cat, list]) => (
                <div className="card" style={{ marginBottom: 16 }} key={cat}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <span className={`tag ${CAT_LABEL[cat]?.color || 'pink'}`} style={{ fontSize: 13, padding: '4px 12px' }}>
                      {CAT_LABEL[cat]?.name || cat}
                    </span>
                    <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 10 }}>
                      {list.filter(i => i.checked).length}/{list.length}
                    </span>
                  </div>
                  {list.map(({ tpl, checked, idx }) => (
                    <div
                      key={tpl.id}
                      className={`checklist-item ${checked ? 'checked' : ''}`}
                      onClick={() => handleToggle(idx)}
                      style={{ cursor: 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggle(idx)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="info">
                        <div className="name">{tpl.name}</div>
                      </div>
                      {tpl.essential && !checked && <span className="essential">必带</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 新建清单弹窗 */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>新建出门清单</h2>
            <div className="form-group">
              <label>选择场景</label>
              <div className="scene-select">
                {(['commute', 'date', 'photo', 'travel'] as SceneType[]).map(s => (
                  <div
                    key={s}
                    className={`scene-card ${newScene === s ? 'active' : ''}`}
                    onClick={() => setNewScene(s)}
                  >
                    <div className="emoji">{s === 'commute' ? '💼' : s === 'date' ? '💕' : s === 'photo' ? '📸' : '✈️'}</div>
                    <div className="name">{SceneLabels[s]}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>关联收藏方案（可选）</label>
              <select value={newLookId} onChange={e => setNewLookId(e.target.value)}>
                <option value="">不关联</option>
                {looks.filter(l => l.scene === newScene).map(l => (
                  <option key={l.id} value={l.id}>⭐ {l.name}</option>
                ))}
                {looks.filter(l => l.scene !== newScene).length > 0 && (
                  <optgroup label="其他场景">
                    {looks.filter(l => l.scene !== newScene).map(l => (
                      <option key={l.id} value={l.id}>⭐ [{SceneLabels[l.scene]}] {l.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div className="btn-group" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate}>创建清单</button>
            </div>
          </div>
        </div>
      )}

      {/* 复盘弹窗 */}
      {showReviewModal && selected && (
        <div className="modal-backdrop" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h2>{editingReview ? '编辑复盘' : '创建复盘'}</h2>
            <div style={{ marginBottom: 12, padding: 10, background: '#fafafa', borderRadius: 8, fontSize: 12, color: '#6b7280' }}>
              📋 清单场景：{SceneLabels[selected.scene]}
              {selectedLook && <span style={{ marginLeft: 10 }}>⭐ 方案：{selectedLook.name}</span>}
            </div>

            {(['comfortScore', 'makeupDurabilityScore', 'sceneFitScore', 'photoQualityScore'] as const).map(key => (
              <div className="form-group" key={key}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{SCORE_LABELS[key]}</span>
                  <span style={{ fontSize: 13, color: '#db2777', fontWeight: 600 }}>
                    {reviewForm[key]} 分
                  </span>
                </label>
                <StarRating
                  value={reviewForm[key]}
                  onChange={v => setReviewForm(f => ({ ...f, [key]: v }))}
                />
              </div>
            ))}

            <div className="form-group">
              <label>备注（可记录感受、问题、改进建议等）</label>
              <textarea
                rows={3}
                value={reviewForm.notes}
                onChange={e => setReviewForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="今天的搭配感觉怎么样？有什么想改进的地方吗？"
              />
            </div>

            <div className="form-group">
              <label>下次提醒日期（可选）</label>
              <input
                type="date"
                value={reviewForm.nextReminderDate}
                onChange={e => setReviewForm(f => ({ ...f, nextReminderDate: e.target.value }))}
              />
            </div>

            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmitReview} disabled={reviewSubmitting}>
                {reviewSubmitting ? '保存中...' : (editingReview ? '更新复盘' : '保存复盘')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}