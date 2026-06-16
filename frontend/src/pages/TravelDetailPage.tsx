import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { travelPlansApi, itemsApi, AllItems } from '../api';
import type { TravelPlan, DailyOutfit, SceneType, ItemCategory, PackingListItem, DailyChecklist } from '../types';
import { SceneLabels, CategoryLabels, TravelStatusLabels } from '../types';

const StatusBadgeColors: Record<string, { bg: string; color: string }> = {
  draft: { bg: '#9ca3af', color: 'white' },
  confirmed: { bg: '#10b981', color: 'white' },
  completed: { bg: '#8b5cf6', color: 'white' },
  cancelled: { bg: '#ef4444', color: 'white' },
};

const CategoryEmoji: Record<ItemCategory, string> = {
  lens: '👁️',
  lipstick: '💄',
  blush: '🌸',
  outfit: '👗',
};

const PackingCategoryLabels: Record<string, string> = {
  care: '护理用品',
  makeup: '彩妆补妆',
  accessory: '配饰工具',
  item: '单品',
  other: '其他',
};

export default function TravelDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [items, setItems] = useState<AllItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'outfits' | 'checklist'>('outfits');
  const [submitting, setSubmitting] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState<{
    dayIndex: number;
    category: ItemCategory;
  } | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [planData, itemsData] = await Promise.all([
        travelPlansApi.get(id),
        itemsApi.getAll(),
      ]);
      setPlan(planData);
      setItems(itemsData);
    } catch (e: any) {
      setError(e?.message || '加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const findItemName = (itemId?: string, category?: ItemCategory): string => {
    if (!itemId || !items || !category) return '-';
    const map: Record<string, any[]> = {
      lens: items.lenses,
      lipstick: items.lipsticks,
      blush: items.blushes,
      outfit: items.outfits,
    };
    const arr = map[category];
    const found = arr?.find((i: any) => i.id === itemId);
    return found?.name || '-';
  };

  const getItemsByCategory = (category: ItemCategory): any[] => {
    if (!items) return [];
    const map: Record<string, any[]> = {
      lens: items.lenses,
      lipstick: items.lipsticks,
      blush: items.blushes,
      outfit: items.outfits,
    };
    return map[category] || [];
  };

  const handleToggleLock = async (dayIndex: number, itemId: string) => {
    if (!plan || plan.status !== 'draft') return;
    const dailyOutfits = plan.dailyOutfits.map(do_ => {
      if (do_.dayIndex !== dayIndex) return do_;
      const lockedIds = do_.lockedIds.includes(itemId)
        ? do_.lockedIds.filter(id => id !== itemId)
        : [...do_.lockedIds, itemId];
      return { ...do_, lockedIds, adjusted: true };
    });

    try {
      const updated = await travelPlansApi.update(plan.id, { dailyOutfits });
      setPlan(updated);
    } catch (e) {
      alert('操作失败');
    }
  };

  const handleChangeItem = async (dayIndex: number, category: ItemCategory, newItemId: string) => {
    if (!plan || plan.status !== 'draft') return;
    const dailyOutfits = plan.dailyOutfits.map(do_ => {
      if (do_.dayIndex !== dayIndex) return do_;
      const items = { ...do_.items };
      const key = `${category}Id` as keyof typeof items;
      (items as any)[key] = newItemId;
      return { ...do_, items, adjusted: true };
    });

    try {
      const updated = await travelPlansApi.update(plan.id, { dailyOutfits });
      setPlan(updated);
      setShowItemPicker(null);
    } catch (e) {
      alert('修改失败');
    }
  };

  const handleRegenerate = async () => {
    if (!plan || plan.status !== 'draft') return;
    if (!confirm('重新生成将覆盖当前搭配，已锁定的单品会保留。确定继续吗？')) return;
    setSubmitting(true);
    try {
      const updated = await travelPlansApi.generateOutfits(plan.id);
      setPlan(updated);
    } catch (e) {
      alert('重新生成失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!plan || plan.status !== 'draft') return;
    if (!confirm('确认后将生成旅行出门清单，确定继续吗？')) return;
    setSubmitting(true);
    try {
      const updated = await travelPlansApi.confirm(plan.id);
      setPlan(updated);
      setActiveTab('checklist');
    } catch (e) {
      alert('确认失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!plan || plan.status !== 'confirmed') return;
    if (!confirm('标记为已完成后将更新使用记录和统计数据。确定继续吗？')) return;
    setSubmitting(true);
    try {
      const updated = await travelPlansApi.complete(plan.id);
      setPlan(updated);
    } catch (e) {
      alert('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    if (!confirm('确认删除该旅行计划？此操作不可撤销。')) return;
    try {
      await travelPlansApi.delete(plan.id);
      navigate('/travel');
    } catch (e) {
      alert('删除失败');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  const getTotalChecklistItems = (): PackingListItem[] => {
    if (!plan?.checklist?.totalItems) return [];
    return plan.checklist.totalItems;
  };

  const getDailyChecklists = (): DailyChecklist[] => {
    if (plan?.dailyChecklists && plan.dailyChecklists.length > 0) {
      return plan.dailyChecklists;
    }
    return plan?.checklist?.dailyChecklists || [];
  };

  const groupByCategory = (listItems: PackingListItem[]) => {
    const groups: Record<string, PackingListItem[]> = {};
    for (const item of listItems) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  };

  if (loading) {
    return <div className="empty"><div className="emoji">⏳</div><p>加载中...</p></div>;
  }

  if (error) {
    return (
      <div className="empty">
        <div className="emoji">❌</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>加载失败</p>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>{error}</p>
        <button className="btn btn-primary btn-sm" onClick={load}>🔄 重试</button>
        <button className="btn btn-secondary btn-sm" style={{ marginLeft: 8 }} onClick={() => navigate('/travel')}>
          返回列表
        </button>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="empty">
        <div className="emoji">🤔</div>
        <p>找不到该旅行计划</p>
        <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/travel')}>
          返回列表
        </button>
      </div>
    );
  }

  const weather = plan.weather?.[0];
  const dailyOutfits = plan.dailyOutfits || [];
  const warnings = plan.warnings || plan.checklist?.warnings || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 8, padding: '4px 0' }}
            onClick={() => navigate('/travel')}
          >
            ← 返回旅行列表
          </button>
          <h1 className="page-title" style={{ margin: 0 }}>
            📌 {plan.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              background: StatusBadgeColors[plan.status]?.bg || '#9ca3af',
              color: StatusBadgeColors[plan.status]?.color || 'white',
            }}>
              {TravelStatusLabels[plan.status] || plan.status}
            </span>
            <span style={{ fontSize: 14, color: '#6b7280' }}>
              📍 {plan.destination} · {plan.days}天
            </span>
            <span style={{ fontSize: 14, color: '#6b7280' }}>
              📅 {formatDate(plan.startDate)} ~ {formatDate(plan.endDate)}
            </span>
          </div>
          {weather && (
            <div style={{ fontSize: 13, color: '#0891b2', marginTop: 8, background: '#ecfeff', padding: '6px 10px', borderRadius: 6, display: 'inline-block' }}>
              🌡️ {weather.minTemp}°C ~ {weather.maxTemp}°C {weather.description || ''}
            </div>
          )}
          {plan.baggageLimit && (
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
              🧳 行李: {plan.baggageLimit.volume || plan.baggageLimit.bags || plan.baggageLimit.weight || '标准'}
            </div>
          )}
        </div>
        <div className="btn-group">
          {plan.status === 'draft' && (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleRegenerate}
                disabled={submitting}
              >
                🔄 重新生成
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/travel/new?id=${plan.id}`)}
              >
                ✏️ 编辑信息
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={submitting}
              >
                ✅ 确认并生成清单
              </button>
            </>
          )}
          {plan.status === 'confirmed' && (
            <button
              className="btn btn-primary"
              onClick={handleComplete}
              disabled={submitting}
            >
              ✅ 标记为已完成
            </button>
          )}
          {plan.status !== 'completed' && plan.status !== 'cancelled' && (
            <button className="btn btn-danger" onClick={handleDelete}>
              🗑️ 删除
            </button>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="card" style={{ marginBottom: 20, background: '#fffbeb', borderColor: '#fbbf24' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#92400e', marginBottom: 10 }}>⚠️ 温馨提醒</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {warnings.map((w, i) => (
              <li key={i} style={{ fontSize: 13, color: '#78350f', lineHeight: 1.8 }}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="tabs" style={{ marginBottom: 20 }}>
        <div
          className={`tab ${activeTab === 'outfits' ? 'active' : ''}`}
          onClick={() => setActiveTab('outfits')}
        >
          👗 每日搭配 ({dailyOutfits.length})
        </div>
        <div
          className={`tab ${activeTab === 'checklist' ? 'active' : ''}`}
          onClick={() => setActiveTab('checklist')}
        >
          📋 打包清单
        </div>
      </div>

      {activeTab === 'outfits' && (
        <div>
          {dailyOutfits.length === 0 ? (
            <div className="empty">
              <div className="emoji">👗</div>
              <p>暂无每日搭配数据</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {dailyOutfits.map(outfit => {
                const dayScene = plan.dailyScenes?.find(s => s.dayIndex === outfit.dayIndex);
                const scene = dayScene?.scene || 'travel';

                return (
                  <div key={outfit.dayIndex} className="card" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>
                          📅 第{outfit.dayIndex + 1}天
                        </h3>
                        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                          场景: {SceneLabels[scene as SceneType] || scene}
                          {dayScene?.notes && ` · ${dayScene.notes}`}
                        </div>
                      </div>
                      {plan.status === 'draft' && (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                          点击单品可替换 · 🔒锁定保留
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                      {(['lens', 'lipstick', 'blush', 'outfit'] as ItemCategory[]).map(category => {
                        const itemId = outfit.items[`${category}Id` as keyof typeof outfit.items] as string | undefined;
                        const itemName = findItemName(itemId, category);
                        const isLocked = outfit.lockedIds?.includes(itemId || '');

                        return (
                          <div
                            key={category}
                            style={{
                              padding: 12,
                              background: '#fafafa',
                              borderRadius: 10,
                              border: isLocked ? '2px solid #8b5cf6' : '1px solid #f3f4f6',
                              cursor: plan.status === 'draft' ? 'pointer' : 'default',
                              transition: 'all 0.2s',
                              position: 'relative',
                            }}
                            onClick={() => {
                              if (plan.status === 'draft') {
                                setShowItemPicker({ dayIndex: outfit.dayIndex, category });
                              }
                            }}
                            onMouseEnter={(e) => {
                              if (plan.status === 'draft') {
                                e.currentTarget.style.background = '#f5f3ff';
                                e.currentTarget.style.borderColor = '#8b5cf6';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (plan.status === 'draft') {
                                e.currentTarget.style.background = '#fafafa';
                                e.currentTarget.style.borderColor = isLocked ? '#8b5cf6' : '#f3f4f6';
                              }
                            }}
                          >
                            {isLocked && (
                              <span style={{ position: 'absolute', top: -8, right: -8, fontSize: 16 }}>🔒</span>
                            )}
                            <div style={{ fontSize: 24, marginBottom: 6 }}>{CategoryEmoji[category]}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
                              {CategoryLabels[category]}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                              {itemName || '未选择'}
                            </div>
                            {plan.status === 'draft' && itemId && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ marginTop: 8, padding: '3px 8px', fontSize: 11 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleLock(outfit.dayIndex, itemId);
                                }}
                              >
                                {isLocked ? '🔓 解锁' : '🔒 锁定'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {plan.status === 'draft' && dailyOutfits.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 24, padding: 20, background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
                调整好每日搭配后，点击"确认并生成清单"来生成最终的打包清单
              </p>
              <button
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={submitting}
              >
                ✅ 确认并生成打包清单
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'checklist' && (
        <div>
          {plan.status === 'draft' ? (
            <div className="empty">
              <div className="emoji">📋</div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>还没有生成清单</p>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>确认旅行计划后将自动生成打包清单</p>
              <button className="btn btn-primary btn-sm" onClick={handleConfirm} disabled={submitting}>
                ✅ 确认并生成清单
              </button>
            </div>
          ) : (
            <div>
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                  📦 总打包清单 ({getTotalChecklistItems().length} 件)
                </h3>
                {(() => {
                  const groups = groupByCategory(getTotalChecklistItems());
                  return Object.entries(groups).map(([category, categoryItems]) => (
                    <div key={category} style={{ marginBottom: 16 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>
                        {PackingCategoryLabels[category] || category} ({categoryItems.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {categoryItems.map(item => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 12px',
                              background: '#fafafa',
                              borderRadius: 8,
                              fontSize: 13,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: item.essential ? 600 : 400 }}>
                                {item.essential ? '⭐ ' : ''}{item.name}
                              </span>
                              {item.isLowStock && (
                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: '#fef3c7', color: '#92400e' }}>
                                  库存低
                                </span>
                              )}
                              {item.isExpiring && (
                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: '#fee2e2', color: '#991b1b' }}>
                                  临期
                                </span>
                              )}
                              {item.isRefill && (
                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: '#dbeafe', color: '#1e40af' }}>
                                  替换装
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {item.quantity !== undefined && item.quantity > 1 && (
                                <span style={{ fontSize: 12, color: '#6b7280' }}>x{item.quantity}</span>
                              )}
                              {item.note && (
                                <span style={{ fontSize: 11, color: '#9ca3af' }}>{item.note}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                  📅 每日子清单
                </h3>
                {getDailyChecklists().length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>暂无每日清单</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {getDailyChecklists().map(dc => (
                      <div key={dc.dayIndex} style={{
                        padding: 14,
                        background: '#f9fafb',
                        borderRadius: 10,
                      }}>
                        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                          第{dc.dayIndex + 1}天 ({dc.items.length} 件)
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {dc.items.map(item => (
                            <span key={item.id} style={{
                              fontSize: 12,
                              padding: '4px 10px',
                              background: 'white',
                              borderRadius: 6,
                              color: '#4b5563',
                              border: '1px solid #e5e7eb',
                            }}>
                              {item.name}
                              {item.quantity !== undefined && item.quantity > 1 ? ` x${item.quantity}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showItemPicker && items && (
        <div className="modal-backdrop" onClick={() => setShowItemPicker(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h2>选择 {CategoryLabels[showItemPicker.category]}</h2>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {getItemsByCategory(showItemPicker.category).length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>暂无可用单品</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {getItemsByCategory(showItemPicker.category).map((item: any) => {
                    const currentOutfit = plan?.dailyOutfits.find(o => o.dayIndex === showItemPicker.dayIndex);
                    const currentId = currentOutfit?.items[`${showItemPicker.category}Id` as keyof typeof currentOutfit.items];
                    const isSelected = currentId === item.id;

                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          cursor: 'pointer',
                          border: isSelected ? '2px solid #db2777' : '1px solid #e5e7eb',
                          background: isSelected ? '#fdf2f8' : 'white',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => handleChangeItem(showItemPicker.dayIndex, showItemPicker.category, item.id)}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'white';
                          }
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                        {item.brand && (
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{item.brand}</div>
                        )}
                        {item.style && item.style.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                            {item.style.slice(0, 3).map((s: string) => (
                              <span key={s} className="tag" style={{ fontSize: 10 }}>{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="btn-group" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowItemPicker(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
