import { useState, useEffect, useCallback } from 'react';
import { makeupPlansApi, itemsApi, savedLooksApi } from '../api';
import type { AllItemsWithRisk } from '../api';
import type {
  MakeupPlan, SceneType, OutfitCombination, SavedLook,
  MakeupPlanStatus, ItemCategory
} from '../types';
import { SceneLabels, MakeupPlanStatusLabels, CategoryLabels } from '../types';

const SCENE_EMOJI: Record<SceneType, string> = {
  commute: '💼', date: '💕', photo: '📸', travel: '✈️',
};
const SCENE_COLORS: Record<SceneType, string> = {
  commute: '#3b82f6', date: '#db2777', photo: '#8b5cf6', travel: '#10b981',
};
const CATEGORY_EMOJI: Record<ItemCategory, string> = {
  lens: '👁️', lipstick: '💄', blush: '🌸', outfit: '👗',
};
const STATUS_COLORS: Record<MakeupPlanStatus, string> = {
  planned: '#3b82f6', reminded: '#f59e0b', in_progress: '#8b5cf6', completed: '#10b981', cancelled: '#9ca3af',
};
const TIME_SLOTS = [
  { value: 'morning', label: '上午' },
  { value: 'afternoon', label: '下午' },
  { value: 'evening', label: '晚间' },
  { value: 'allday', label: '全天' },
];
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const cells: Date[] = [];
  for (let i = -startDay; i < 42 - startDay; i++) {
    cells.push(new Date(year, month, 1 + i));
  }
  return cells;
}

function getWeekGrid(date: Date): Date[] {
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(start.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

interface PlanFormData {
  date: string;
  timeSlot: string;
  eventName: string;
  scene: SceneType;
  location: string;
  expectedDuration: number;
  needsPhoto: boolean;
  notes: string;
  savedLookId: string;
  items: OutfitCombination;
}

const emptyForm: PlanFormData = {
  date: formatDate(new Date()),
  timeSlot: 'allday',
  eventName: '',
  scene: 'commute',
  location: '',
  expectedDuration: 2,
  needsPhoto: false,
  notes: '',
  savedLookId: '',
  items: {},
};

export default function CalendarPage() {
  const [plans, setPlans] = useState<MakeupPlan[]>([]);
  const [items, setItems] = useState<AllItemsWithRisk | null>(null);
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sceneFilter, setSceneFilter] = useState<SceneType | 'all'>('all');

  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MakeupPlan | null>(null);
  const [form, setForm] = useState<PlanFormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const [showQuickEdit, setShowQuickEdit] = useState<MakeupPlan | null>(null);
  const [recommendations, setRecommendations] = useState<OutfitCombination[]>([]);
  const [loadingRec, setLoadingRec] = useState(false);

  const [dragPlan, setDragPlan] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const startDate = formatDate(new Date(year, month - 1, 1));
      const endDate = formatDate(new Date(year, month + 2, 0));
      const [p, i, l] = await Promise.all([
        makeupPlansApi.getAll({ startDate, endDate }),
        itemsApi.getAllWithRisk(),
        savedLooksApi.getAll(),
      ]);
      setPlans(p);
      setItems(i);
      setLooks(l);
    } catch (e: any) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredPlans = plans.filter(p => {
    if (sceneFilter !== 'all' && p.scene !== sceneFilter) return false;
    return true;
  });

  const plansByDate = new Map<string, MakeupPlan[]>();
  for (const p of filteredPlans) {
    const arr = plansByDate.get(p.date) || [];
    arr.push(p);
    plansByDate.set(p.date, arr);
  }

  const grid = viewMode === 'month' ? getMonthGrid(year, month) : getWeekGrid(currentDate);

  const findItemName = (id?: string, cat: ItemCategory = 'lens'): string => {
    if (!id || !items) return '-';
    const map: Record<string, any[]> = { lens: items.lenses, lipstick: items.lipsticks, blush: items.blushes, outfit: items.outfits };
    return map[cat]?.find((x: any) => x.id === id)?.name || '-';
  };

  const prevPeriod = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month - 1, 1));
    else { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }
  };
  const nextPeriod = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month + 1, 1));
    else { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }
  };
  const goToday = () => setCurrentDate(new Date());

  const openCreate = (date?: string) => {
    setEditingPlan(null);
    setForm({ ...emptyForm, date: date || formatDate(new Date()) });
    setRecommendations([]);
    setShowModal(true);
  };

  const openEdit = (plan: MakeupPlan) => {
    setEditingPlan(plan);
    setForm({
      date: plan.date,
      timeSlot: plan.timeSlot,
      eventName: plan.eventName,
      scene: plan.scene,
      location: plan.location || '',
      expectedDuration: plan.expectedDuration || 2,
      needsPhoto: plan.needsPhoto,
      notes: plan.notes || '',
      savedLookId: plan.savedLookId || '',
      items: { ...plan.items },
    });
    setRecommendations([]);
    setShowModal(true);
    setShowQuickEdit(null);
  };

  const handleSave = async () => {
    if (!form.eventName.trim()) return;
    setSaving(true);
    try {
      if (editingPlan) {
        await makeupPlansApi.update(editingPlan.id, {
          date: form.date,
          timeSlot: form.timeSlot,
          eventName: form.eventName,
          scene: form.scene,
          location: form.location || undefined,
          expectedDuration: form.expectedDuration || undefined,
          needsPhoto: form.needsPhoto,
          notes: form.notes || undefined,
          savedLookId: form.savedLookId || undefined,
          items: form.items,
        });
      } else {
        await makeupPlansApi.create({
          date: form.date,
          timeSlot: form.timeSlot,
          eventName: form.eventName,
          scene: form.scene,
          location: form.location || undefined,
          expectedDuration: form.expectedDuration || undefined,
          needsPhoto: form.needsPhoto,
          notes: form.notes || undefined,
          savedLookId: form.savedLookId || undefined,
          items: form.items,
        });
      }
      setShowModal(false);
      loadData();
    } catch (e: any) {
      setError(e.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此计划？')) return;
    try {
      await makeupPlansApi.delete(id);
      setShowQuickEdit(null);
      loadData();
    } catch {}
  };

  const handleStatusChange = async (id: string, status: MakeupPlanStatus) => {
    try {
      await makeupPlansApi.update(id, { status });
      setShowQuickEdit(null);
      loadData();
    } catch {}
  };

  const handleComplete = async (id: string) => {
    try {
      await makeupPlansApi.complete(id);
      setShowQuickEdit(null);
      loadData();
    } catch {}
  };

  const handleConvertChecklist = async (id: string) => {
    try {
      await makeupPlansApi.convertChecklist(id);
      alert('已生成出门清单！');
      loadData();
    } catch {}
  };

  const handleDragStart = (planId: string) => {
    setDragPlan(planId);
  };

  const handleDrop = async (targetDate: string) => {
    if (!dragPlan) return;
    try {
      await makeupPlansApi.update(dragPlan, { date: targetDate });
      setDragPlan(null);
      loadData();
    } catch {
      setDragPlan(null);
    }
  };

  const loadRecommendations = async () => {
    setLoadingRec(true);
    try {
      const recs = await makeupPlansApi.recommend(form.scene, form.date);
      setRecommendations(recs);
    } catch {
      setRecommendations([]);
    } finally {
      setLoadingRec(false);
    }
  };

  const applySavedLook = (lookId: string) => {
    const look = looks.find(l => l.id === lookId);
    if (look) {
      setForm(f => ({ ...f, savedLookId: lookId, items: { ...look.items }, scene: look.scene }));
    }
  };

  const applyRecommendation = (combo: OutfitCombination) => {
    setForm(f => ({ ...f, items: { ...combo } }));
  };

  const applyItem = (category: ItemCategory, id: string) => {
    setForm(f => ({
      ...f,
      items: { ...f.items, [`${category}Id`]: id },
    }));
  };

  const todayStr = formatDate(new Date());

  const renderPlanBadge = (plan: MakeupPlan, compact: boolean = false) => (
    <div
      key={plan.id}
      className={`cal-plan-badge ${dragPlan === plan.id ? 'dragging' : ''}`}
      style={{ borderLeftColor: SCENE_COLORS[plan.scene] }}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', plan.id); handleDragStart(plan.id); }}
      onDragEnd={() => setDragPlan(null)}
      onClick={(e) => { e.stopPropagation(); setShowQuickEdit(plan); }}
    >
      <span className="cal-plan-scene">{SCENE_EMOJI[plan.scene]}</span>
      <span className="cal-plan-name">{compact ? plan.eventName.slice(0, 6) : plan.eventName}</span>
      {plan.warnings.length > 0 && <span className="cal-plan-risk">⚠️</span>}
      {plan.needsPhoto && <span className="cal-plan-photo">📷</span>}
      <span className="cal-plan-status" style={{ background: STATUS_COLORS[plan.status] }}>
        {compact ? '' : MakeupPlanStatusLabels[plan.status]}
      </span>
    </div>
  );

  return (
    <div>
      <h1 className="page-title">📅 妆容日历</h1>

      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="btn btn-secondary btn-sm" onClick={prevPeriod}>◀</button>
          <button className="btn btn-ghost btn-sm" onClick={goToday}>今天</button>
          <button className="btn btn-secondary btn-sm" onClick={nextPeriod}>▶</button>
          <span className="cal-period-label">
            {viewMode === 'month'
              ? `${year}年${month + 1}月`
              : `${formatDate(grid[0])} ~ ${formatDate(grid[6])}`}
          </span>
        </div>
        <div className="cal-view-toggle">
          <button className={`tab ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>月视图</button>
          <button className={`tab ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>周视图</button>
        </div>
        <div className="cal-filter">
          <button className={`tab ${sceneFilter === 'all' ? 'active' : ''}`} onClick={() => setSceneFilter('all')}>全部</button>
          {(['commute', 'date', 'photo', 'travel'] as SceneType[]).map(s => (
            <button key={s} className={`tab ${sceneFilter === s ? 'active' : ''}`} onClick={() => setSceneFilter(s)}>
              {SCENE_EMOJI[s]} {SceneLabels[s]}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => openCreate()}>+ 新建计划</button>
      </div>

      {loading && (
        <div className="empty"><div className="emoji">⏳</div><p>加载计划中...</p></div>
      )}

      {error && (
        <div className="empty">
          <div className="emoji">❌</div>
          <p>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={loadData}>重新加载</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {viewMode === 'month' ? (
            <div className="cal-month">
              <div className="cal-header-row">
                {WEEKDAYS.map(d => <div key={d} className="cal-header-cell">{d}</div>)}
              </div>
              <div className="cal-grid">
                {grid.map((date, i) => {
                  const dateStr = formatDate(date);
                  const isCurrentMonth = date.getMonth() === month;
                  const isToday = dateStr === todayStr;
                  const dayPlans = plansByDate.get(dateStr) || [];
                  return (
                    <div
                      key={i}
                      className={`cal-cell ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                      onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                      onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); const pid = e.dataTransfer.getData('text/plain'); if (pid) { setDragPlan(pid); handleDrop(dateStr); } }}
                      onClick={() => openCreate(dateStr)}
                    >
                      <div className="cal-date-num">
                        {date.getDate()}
                        {isToday && <span className="cal-today-dot" />}
                      </div>
                      <div className="cal-plan-list">
                        {dayPlans.slice(0, 3).map(p => renderPlanBadge(p, true))}
                        {dayPlans.length > 3 && <div className="cal-more">+{dayPlans.length - 3}更多</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="cal-week">
              <div className="cal-header-row">
                {grid.map((date, i) => {
                  const dateStr = formatDate(date);
                  const isToday = dateStr === todayStr;
                  return (
                    <div key={i} className={`cal-week-header-cell ${isToday ? 'today' : ''}`}>
                      <div>{WEEKDAYS[date.getDay()]}</div>
                      <div className="cal-week-date">{date.getDate()}</div>
                    </div>
                  );
                })}
              </div>
              <div className="cal-week-body">
                {grid.map((date, i) => {
                  const dateStr = formatDate(date);
                  const dayPlans = plansByDate.get(dateStr) || [];
                  return (
                    <div
                      key={i}
                      className="cal-week-cell"
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                      onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                      onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); const pid = e.dataTransfer.getData('text/plain'); if (pid) { setDragPlan(pid); handleDrop(dateStr); } }}
                      onClick={() => openCreate(dateStr)}
                    >
                      {dayPlans.length === 0 && <div className="cal-week-empty">无计划</div>}
                      {dayPlans.map(p => renderPlanBadge(p))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && plans.length === 0 && (
            <div className="empty">
              <div className="emoji">📅</div>
              <p>还没有妆容计划，点击日历或「新建计划」开始规划吧</p>
            </div>
          )}
        </>
      )}

      {showQuickEdit && (
        <div className="modal-backdrop" onClick={() => setShowQuickEdit(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h2 style={{ fontSize: 18, marginBottom: 16 }}>
              {SCENE_EMOJI[showQuickEdit.scene]} {showQuickEdit.eventName}
            </h2>
            <div className="cal-quick-info">
              <div><span className="cal-info-label">日期</span>{showQuickEdit.date}</div>
              <div><span className="cal-info-label">时段</span>{showQuickEdit.timeSlot}</div>
              <div><span className="cal-info-label">场景</span>{SceneLabels[showQuickEdit.scene]}</div>
              {showQuickEdit.location && <div><span className="cal-info-label">地点</span>{showQuickEdit.location}</div>}
              {showQuickEdit.expectedDuration && <div><span className="cal-info-label">时长</span>{showQuickEdit.expectedDuration}小时</div>}
              <div><span className="cal-info-label">拍照</span>{showQuickEdit.needsPhoto ? '是' : '否'}</div>
              <div><span className="cal-info-label">状态</span>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 12, background: STATUS_COLORS[showQuickEdit.status], color: 'white' }}>
                  {MakeupPlanStatusLabels[showQuickEdit.status]}
                </span>
              </div>
            </div>
            {showQuickEdit.items && (
              <div className="cal-quick-items">
                <span className="cal-info-label">搭配单品</span>
                <div className="cal-quick-item-list">
                  {showQuickEdit.items.lensId && <span className="tag pink">👁️ {findItemName(showQuickEdit.items.lensId, 'lens')}</span>}
                  {showQuickEdit.items.lipstickId && <span className="tag purple">💄 {findItemName(showQuickEdit.items.lipstickId, 'lipstick')}</span>}
                  {showQuickEdit.items.blushId && <span className="tag blue">🌸 {findItemName(showQuickEdit.items.blushId, 'blush')}</span>}
                  {showQuickEdit.items.outfitId && <span className="tag green">👗 {findItemName(showQuickEdit.items.outfitId, 'outfit')}</span>}
                </div>
              </div>
            )}
            {showQuickEdit.warnings.length > 0 && (
              <div className="cal-quick-warnings">
                {showQuickEdit.warnings.map((w, i) => <div key={i} className="cal-warning-item">⚠️ {w}</div>)}
              </div>
            )}
            {showQuickEdit.reminders.length > 0 && (
              <div className="cal-quick-reminders">
                <span className="cal-info-label">待办提醒</span>
                {showQuickEdit.reminders.filter(r => !r.dismissed).map((r, i) => (
                  <div key={i} className="cal-reminder-item">🔔 {r.message}</div>
                ))}
              </div>
            )}
            <div className="cal-quick-actions">
              <button className="btn btn-primary btn-sm" onClick={() => openEdit(showQuickEdit)}>✏️ 编辑</button>
              {showQuickEdit.status !== 'completed' && showQuickEdit.status !== 'cancelled' && (
                <>
                  <button className="btn btn-sm" style={{ background: '#10b981', color: 'white' }} onClick={() => handleComplete(showQuickEdit.id)}>✅ 完成</button>
                  {!showQuickEdit.checklistId && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleConvertChecklist(showQuickEdit.id)}>📋 生成清单</button>
                  )}
                </>
              )}
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(showQuickEdit.id)}>🗑️ 删除</button>
            </div>
            {showQuickEdit.status !== 'completed' && showQuickEdit.status !== 'cancelled' && (
              <div style={{ marginTop: 12, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
                <div className="cal-info-label" style={{ marginBottom: 6 }}>快捷改状态</div>
                <div className="btn-group">
                  {(['planned', 'reminded', 'in_progress'] as MakeupPlanStatus[]).map(s => (
                    <button key={s} className={`btn btn-sm ${showQuickEdit.status === s ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleStatusChange(showQuickEdit.id, s)}>
                      {MakeupPlanStatusLabels[s]}
                    </button>
                  ))}
                  <button className="btn btn-sm btn-ghost" onClick={() => handleStatusChange(showQuickEdit.id, 'cancelled')}>取消计划</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: '92vh' }}>
            <h2>{editingPlan ? '编辑计划' : '新建妆容计划'}</h2>

            <div className="form-group">
              <label>日期 *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>时段</label>
              <select value={form.timeSlot} onChange={e => setForm(f => ({ ...f, timeSlot: e.target.value }))}>
                {TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>事件名称 *</label>
              <input type="text" value={form.eventName} onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))} placeholder="如：公司年会、闺蜜下午茶" />
            </div>
            <div className="form-group">
              <label>场景类型 *</label>
              <div className="scene-select">
                {(['commute', 'date', 'photo', 'travel'] as SceneType[]).map(s => (
                  <div key={s} className={`scene-card ${form.scene === s ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, scene: s }))}>
                    <div className="emoji">{SCENE_EMOJI[s]}</div>
                    <div className="name">{SceneLabels[s]}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>地点</label>
                <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="如：国贸大厦" />
              </div>
              <div className="form-group" style={{ width: 120 }}>
                <label>预计时长(h)</label>
                <input type="number" min={0.5} step={0.5} value={form.expectedDuration} onChange={e => setForm(f => ({ ...f, expectedDuration: +e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.needsPhoto} onChange={e => setForm(f => ({ ...f, needsPhoto: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#db2777' }} />
                需要拍照
              </label>
            </div>
            <div className="form-group">
              <label>备注</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="其他备注信息" />
            </div>

            <div className="form-group">
              <label>关联收藏方案</label>
              <select value={form.savedLookId} onChange={e => { if (e.target.value) applySavedLook(e.target.value); else setForm(f => ({ ...f, savedLookId: '', items: {} })); }}>
                <option value="">-- 手动选择 --</option>
                {looks.filter(l => l.scene === form.scene).map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
                {looks.filter(l => l.scene !== form.scene).length > 0 && (
                  <optgroup label="其他场景">
                    {looks.filter(l => l.scene !== form.scene).map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({SceneLabels[l.scene]})</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>搭配单品</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={loadRecommendations} disabled={loadingRec}>
                  {loadingRec ? '推荐中...' : '🤖 AI 推荐'}
                </button>
              </div>
              {recommendations.length > 0 && (
                <div className="cal-recommend-list">
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>点击推荐方案应用：</div>
                  {recommendations.map((rec, i) => (
                    <div key={i} className="cal-recommend-card" onClick={() => applyRecommendation(rec)}>
                      方案{i + 1}：
                      {rec.lensId && <span className="tag pink" style={{ margin: 2 }}>👁️ {findItemName(rec.lensId, 'lens')}</span>}
                      {rec.lipstickId && <span className="tag purple" style={{ margin: 2 }}>💄 {findItemName(rec.lipstickId, 'lipstick')}</span>}
                      {rec.blushId && <span className="tag blue" style={{ margin: 2 }}>🌸 {findItemName(rec.blushId, 'blush')}</span>}
                      {rec.outfitId && <span className="tag green" style={{ margin: 2 }}>👗 {findItemName(rec.outfitId, 'outfit')}</span>}
                    </div>
                  ))}
                </div>
              )}
              <div className="cal-item-selects">
                {(['lens', 'lipstick', 'blush', 'outfit'] as ItemCategory[]).map(cat => {
                  const key = `${cat}Id` as keyof OutfitCombination;
                  const allItems = items ? (items as any)[`${cat}es`] || (items as any)[cat + 's'] || [] : [];
                  return (
                    <div key={cat} className="form-group cal-item-select">
                      <label>{CATEGORY_EMOJI[cat]} {CategoryLabels[cat]}</label>
                      <select value={(form.items[key] as string) || ''} onChange={e => applyItem(cat, e.target.value)}>
                        <option value="">未选择</option>
                        {allItems.map((item: any) => (
                          <option key={item.id} value={item.id}>
                            {item.name}{item.riskInfo?.risks?.length ? ' ⚠️' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="btn-group" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.eventName.trim()}>
                {saving ? '保存中...' : (editingPlan ? '更新' : '创建')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
