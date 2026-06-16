import { Component, useEffect, useState, useMemo } from 'react';
import { statsApi, itemsApi, savedLooksApi } from '../api';
import type { Stats, AllItems, SavedLook, SceneType } from '../types';
import { SceneLabels } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const SCENE_COLORS: Record<SceneType, string> = {
  commute: '#3b82f6',
  date: '#db2777',
  photo: '#8b5cf6',
  travel: '#10b981',
};

const SCENE_EMOJI: Record<SceneType, string> = {
  commute: '💼',
  date: '💕',
  photo: '📸',
  travel: '✈️',
};

const COLORS = ['#db2777', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

class PageErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error?: string }> {
  state = { hasError: false, error: '' };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="empty" style={{ padding: 60 }}>
          <div className="emoji">⚠️</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>统计页面渲染出错</p>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>{this.state.error || '请刷新页面重试'}</p>
          <button className="btn btn-primary btn-sm" onClick={() => this.setState({ hasError: false, error: '' })}>🔄 重新加载</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<AllItems | null>(null);
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorBoundaryKey, setErrorBoundaryKey] = useState(0);

  const load = async () => {
    setLoading(true);
    setErrorBoundaryKey(k => k + 1);
    try {
      const [s, i, l] = await Promise.all([statsApi.get(), itemsApi.getAll(), savedLooksApi.getAll()]);
      setStats(s);
      setItems(i);
      setLooks(l);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const findItem = (id?: string, category: 'lens' | 'lipstick' | 'blush' | 'outfit' = 'lens'): string => {
    if (!id || !items) return '-';
    const map: Record<string, any[]> = { lens: items.lenses, lipstick: items.lipsticks, blush: items.blushes, outfit: items.outfits };
    const arr = map[category];
    if (!arr || !Array.isArray(arr)) return '-';
    const found = arr.find((x: any) => x && x.id === id);
    return found?.name || '-';
  };

  const pieData = useMemo(() => {
    try {
      const dist = stats?.sceneDistribution;
      if (!dist || !Array.isArray(dist)) return [];
      return dist
        .filter(s => s && typeof s.count === 'number' && s.count > 0)
        .map(s => ({
          name: SceneLabels[s.scene as SceneType] || s.scene,
          value: s.count,
          color: SCENE_COLORS[s.scene as SceneType] || '#9ca3af',
        }));
    } catch { return []; }
  }, [stats]);

  const totalItems = items ? items.lenses.length + items.lipsticks.length + items.blushes.length + items.outfits.length : 0;

  const safePieLabel = ({ name, percent }: { name?: string; percent?: number }) => {
    try {
      if (percent == null || isNaN(percent) || !isFinite(percent)) return name || '';
      return `${name || ''} ${(percent * 100).toFixed(0)}%`;
    } catch { return name || ''; }
  };

  const styleReuseData = useMemo(() => {
    try {
      const arr = stats?.styleReuseRate;
      if (!arr || !Array.isArray(arr)) return [];
      return arr.filter(s => s && typeof s.style === 'string').map(s => ({
        style: String(s.style),
        totalUsed: Number(s.totalUsed) || 0,
        uniqueLooks: Number(s.uniqueLooks) || 1,
        reuseRate: Number(s.reuseRate) || 0,
      }));
    } catch { return []; }
  }, [stats]);

  const topCombos = useMemo(() => {
    try {
      const arr = stats?.topCombinations;
      if (!arr || !Array.isArray(arr)) return [];
      return arr.slice(0, 5).filter(c => c && c.combination);
    } catch { return []; }
  }, [stats]);

  const missedRank = useMemo(() => {
    try {
      const arr = stats?.missedItemsRank;
      if (!arr || !Array.isArray(arr)) return [];
      return arr.filter(m => m && typeof m.itemName === 'string');
    } catch { return []; }
  }, [stats]);

  const sceneDistWithCount = useMemo(() => {
    try {
      const dist = stats?.sceneDistribution;
      if (!dist || !Array.isArray(dist)) return [];
      return dist.filter(s => s && typeof s.count === 'number' && s.count > 0);
    } catch { return []; }
  }, [stats]);

  return (
    <div>
      <h1 className="page-title">📊 统计分析</h1>

      {loading && <div className="empty"><div className="emoji">⏳</div><p>加载统计中...</p></div>}

      {!loading && (
        <PageErrorBoundary key={errorBoundaryKey}>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="label">总搭配次数</div>
              <div className="value">{stats?.totalLooks || 0}</div>
            </div>
            <div className="stat-card">
              <div className="label">清单完成次数</div>
              <div className="value">{stats?.totalChecklists || 0}</div>
            </div>
            <div className="stat-card">
              <div className="label">收藏方案数</div>
              <div className="value">{looks.length}</div>
            </div>
            <div className="stat-card">
              <div className="label">单品总数</div>
              <div className="value">{totalItems}</div>
            </div>
          </div>

          {(stats?.totalLooks || 0) === 0 && (
            <div className="empty">
              <div className="emoji">📊</div>
              <p>还没有使用数据，完成几次出门清单后就能看到统计啦~</p>
            </div>
          )}

          {(stats?.totalLooks || 0) > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div className="chart-card">
                  <h3>各场景使用占比</h3>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          dataKey="value"
                          label={safePieLabel}
                          labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                          isAnimationActive={false}
                        >
                          {pieData.map((entry, idx) => (
                            <Cell key={`cell-${idx}-${entry.name}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>暂无数据</div>
                  )}
                </div>

                <div className="chart-card">
                  <h3>高频搭配组合 Top 5</h3>
                  {topCombos.length > 0 ? (
                    <div>
                      {topCombos.map((c, i) => (
                        <div key={`combo-${i}`} style={{ padding: '10px 0', borderBottom: i < topCombos.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>
                              🏆 第{i + 1}名
                            </span>
                            <span style={{
                              fontSize: 14, fontWeight: 700,
                              background: 'linear-gradient(135deg, #db2777, #8b5cf6)',
                              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'
                            }}>
                              {c.count}次
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.8 }}>
                            👁️ {findItem(c.combination?.lensId, 'lens')} ·
                            💄 {findItem(c.combination?.lipstickId, 'lipstick')} ·
                            🌸 {findItem(c.combination?.blushId, 'blush')} ·
                            👗 {findItem(c.combination?.outfitId, 'outfit')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>暂无数据</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="chart-card">
                  <h3>遗漏物品排行</h3>
                  {missedRank.length > 0 ? (
                    <div>
                      {missedRank.map((m, i) => (
                        <div className="rank-item" key={`missed-${i}-${m.itemName}`}>
                          <div className="rank">{i + 1}</div>
                          <div className="name">{m.itemName}</div>
                          <div className="count">遗漏 {m.count} 次</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>🎉 从未遗漏任何物品！</div>
                  )}
                </div>

                <div className="chart-card">
                  <h3>不同风格复用率</h3>
                  {styleReuseData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={styleReuseData} layout="vertical" margin={{ left: 0, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                        <YAxis type="category" dataKey="style" stroke="#9ca3af" fontSize={12} width={80} />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            value,
                            name === 'reuseRate' ? '复用率' : name === 'totalUsed' ? '总使用次数' : name === 'uniqueLooks' ? '方案数' : name
                          ]}
                        />
                        <Bar dataKey="reuseRate" fill="#db2777" radius={[0, 6, 6, 0]} name="复用率" isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>暂无数据</div>
                  )}
                </div>
              </div>

              {sceneDistWithCount.length > 0 && (
                <div className="chart-card" style={{ marginTop: 20 }}>
                  <h3>场景使用次数</h3>
                  {sceneDistWithCount.map((s: any) => {
                    const scene = s.scene as SceneType;
                    return (
                      <div className="bar-row" key={`scene-bar-${scene}`}>
                        <div className="name">
                          {SCENE_EMOJI[scene] || '📍'} {SceneLabels[scene] || scene}
                        </div>
                        <div className="bar">
                          <div className="fill" style={{
                            width: `${Math.max(s.percentage || 10, s.count > 0 ? 10 : 0)}%`,
                            background: `linear-gradient(90deg, ${SCENE_COLORS[scene] || '#db2777'}, #8b5cf6)`
                          }}></div>
                        </div>
                        <div className="count">{s.count} 次 ({s.percentage || 0}%)</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </PageErrorBoundary>
      )}
    </div>
  );
}