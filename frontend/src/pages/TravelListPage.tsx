import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { travelPlansApi, itemsApi, AllItems } from '../api';
import type { TravelPlan, TravelStatus, SceneType, DailyScene } from '../types';
import { TravelStatusLabels, SceneLabels } from '../types';

const SceneEmojis: Record<SceneType, string> = {
  commute: '💼',
  date: '💕',
  photo: '📸',
  travel: '✈️',
};

const StatusBadgeColors: Record<TravelStatus, { bg: string; color: string }> = {
  draft: { bg: '#9ca3af', color: 'white' },
  confirmed: { bg: '#10b981', color: 'white' },
  completed: { bg: '#8b5cf6', color: 'white' },
  cancelled: { bg: '#ef4444', color: 'white' },
};

export default function TravelListPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [items, setItems] = useState<AllItems | null>(null);
  const [filter, setFilter] = useState<TravelStatus | 'all'>('all');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [plansData, itemsData] = await Promise.all([
        travelPlansApi.getAll(),
        itemsApi.getAll(),
      ]);
      setPlans(plansData);
      setItems(itemsData);
    } catch (e) {
      if (confirm('加载失败，点击重试')) {
        load();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? plans : plans.filter(p => p.status === filter);

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该旅行计划？')) return;
    try {
      await travelPlansApi.delete(id);
      load();
    } catch (e) {
      alert('删除失败');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>✈️ 旅行打包</h1>
        <button className="btn btn-primary" onClick={() => navigate('/travel/new')}>+ 新建旅行计划</button>
      </div>

      <div className="tabs">
        <div className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          全部 ({plans.length})
        </div>
        {(['draft', 'confirmed', 'completed', 'cancelled'] as TravelStatus[]).map(s => {
          const c = plans.filter(p => p.status === s).length;
          return (
            <div key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {TravelStatusLabels[s]} ({c})
            </div>
          );
        })}
      </div>

      {loading && <div className="empty"><div className="emoji">⏳</div><p>加载中...</p></div>}

      {!loading && filtered.length === 0 && (
        <div className="empty"><div className="emoji">🏖️</div><p>还没有旅行计划，点击右上角创建你的第一次旅行吧~</p></div>
      )}

      <div className="grid">
        {filtered.map(plan => {
          const weather = plan.weather?.[0];
          const dailyScenes: DailyScene[] = plan.dailyScenes || [];

          return (
            <div key={plan.id} className="card item-card suggestion-card">
              <div style={{ position: 'absolute', top: 12, right: 12 }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  background: StatusBadgeColors[plan.status].bg,
                  color: StatusBadgeColors[plan.status].color,
                }}>
                  {TravelStatusLabels[plan.status]}
                </span>
              </div>
              <div style={{ marginTop: 4 }}>
                <h3 style={{ marginTop: 0 }}>📌 {plan.name}</h3>
                <div className="brand" style={{ color: '#6b7280', marginBottom: 8 }}>
                  目的地 {plan.destination} · {plan.days}天
                </div>
                <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 8 }}>
                  📅 {formatDate(plan.startDate)} ~ {formatDate(plan.endDate)}
                </div>
                {weather && (
                  <div style={{ fontSize: 13, color: '#0891b2', marginBottom: 8, background: '#ecfeff', padding: '6px 10px', borderRadius: 6 }}>
                    🌡️ {weather.minTemp}°C ~ {weather.maxTemp}°C {weather.description || ''}
                  </div>
                )}
                <div style={{
                  fontSize: 13,
                  color: '#6b7280',
                  background: '#f9fafb',
                  padding: '8px 10px',
                  borderRadius: 6,
                  marginBottom: 12,
                }}>
                  {dailyScenes.map((ds, i) => (
                    <span key={ds.dayIndex} style={{ marginRight: 8 }}>
                      {SceneEmojis[ds.scene]}
                    </span>
                  ))}
                  <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>
                    ({dailyScenes.length}天场景)
                  </span>
                </div>
              </div>
              <div className="actions">
                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/travel/${plan.id}`)}>查看详情</button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/travel/new?id=${plan.id}`)}>编辑</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(plan.id)}>删除</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
