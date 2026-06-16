import { Component, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsApi, itemsApi, savedLooksApi, AllItemsWithRisk } from '../api';
import type { Stats, SavedLook, SceneType, RiskType, ItemCategory } from '../types';
import { SceneLabels, CategoryLabels } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

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
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<AllItemsWithRisk | null>(null);
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorBoundaryKey, setErrorBoundaryKey] = useState(0);

  const load = async () => {
    setLoading(true);
    setErrorBoundaryKey(k => k + 1);
    try {
      const [s, i, l] = await Promise.all([statsApi.get(), itemsApi.getAllWithRisk(), savedLooksApi.getAll()]);
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

  const RISK_CONFIG: Record<RiskType, { label: string; color: string; emoji: string }> = {
    expired: { label: '已过期', color: '#dc2626', emoji: '⚠️' },
    expiring_soon: { label: '即将过期', color: '#d97706', emoji: '⏰' },
    low_stock: { label: '库存不足', color: '#ea580c', emoji: '📦' },
    long_unused: { label: '长期闲置', color: '#6b7280', emoji: '💤' },
  };

  const CATEGORY_EMOJI: Record<ItemCategory, string> = {
    lens: '👁️', lipstick: '💄', blush: '🌸', outfit: '👗',
  };

  const inventoryStats = stats?.inventoryStats;
  const healthScore = inventoryStats?.healthScore ?? 100;
  const healthColor = healthScore >= 80 ? '#059669' : healthScore >= 60 ? '#d97706' : '#dc2626';
  const healthLabel = healthScore >= 80 ? '健康' : healthScore >= 60 ? '一般' : '需关注';

  const inventoryOverviewData = useMemo(() => {
    if (!inventoryStats) return [];
    return [
      { name: '库存充足', value: inventoryStats.inStockCount, color: '#059669' },
      { name: '库存偏低', value: inventoryStats.lowStockCount, color: '#d97706' },
      { name: '已缺货', value: inventoryStats.outOfStockCount, color: '#dc2626' },
    ].filter(d => d.value > 0);
  }, [inventoryStats]);

  const expiringSoonItems = useMemo(() => stats?.expiringSoonItems || [], [stats]);
  const restockPriority = useMemo(() => stats?.restockPriority || [], [stats]);
  const longUnusedItems = useMemo(() => stats?.longUnusedItems || [], [stats]);

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
        styleName: String(s.style),
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

  const scoreTrendData = useMemo(() => {
    try {
      const data = stats?.reviewStats?.scoreTrend;
      if (!data || !Array.isArray(data)) return [];
      return data.filter(d => d && typeof d.averageScore === 'number');
    } catch { return []; }
  }, [stats]);

  const lowScoreKeywordsData = useMemo(() => {
    try {
      const data = stats?.reviewStats?.lowScoreKeywords;
      if (!data || !Array.isArray(data)) return [];
      return data.filter(d => d && typeof d.keyword === 'string' && d.count > 0);
    } catch { return []; }
  }, [stats]);

  const upcomingRemindersData = useMemo(() => {
    try {
      const data = stats?.reviewStats?.upcomingReminders;
      if (!data || !Array.isArray(data)) return [];
      return data.filter(d => d && d.review);
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

          {(stats?.totalLooks || 0) === 0 && totalItems === 0 && (
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
                        <YAxis type="category" dataKey="styleName" stroke="#9ca3af" fontSize={12} width={80} />
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                <div className="chart-card">
                  <h3>📈 复盘评分趋势</h3>
                  {scoreTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={scoreTrendData} margin={{ left: 0, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                        <YAxis domain={[0, 5]} stroke="#9ca3af" fontSize={12} />
                        <Tooltip
                          formatter={(value: number) => [`${value} 分`, '平均评分']}
                          labelFormatter={(label) => `日期：${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="averageScore"
                          stroke="#db2777"
                          strokeWidth={3}
                          dot={{ fill: '#db2777', r: 5 }}
                          activeDot={{ r: 7 }}
                          name="平均评分"
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                      <div>还没有复盘数据</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>完成清单后创建复盘即可查看趋势</div>
                    </div>
                  )}
                </div>

                <div className="chart-card">
                  <h3>⚠️ 低评分原因关键词</h3>
                  {lowScoreKeywordsData.length > 0 ? (
                    <div>
                      {lowScoreKeywordsData.map((item, i) => (
                        <div
                          key={`kw-${i}-${item.keyword}`}
                          className="rank-item"
                          style={{
                            background: i < 3 ? 'linear-gradient(90deg, #fef2f2, #fef3c7)' : 'transparent'
                          }}
                        >
                          <div className="rank" style={{
                            background: i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : i === 2 ? '#3b82f6' : '#9ca3af',
                            color: 'white'
                          }}>
                            {i + 1}
                          </div>
                          <div className="name">
                            <span style={{ fontWeight: 600 }}>{item.keyword}</span>
                          </div>
                          <div className="count">出现 {item.count} 次</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                      <div>暂无低评分记录</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>继续保持好状态！</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="chart-card" style={{ marginTop: 20 }}>
                <h3>⏰ 下次提醒列表</h3>
                {upcomingRemindersData.length > 0 ? (
                  <div>
                    {upcomingRemindersData.map((item, i) => {
                      const reviewDate = item.review.nextReminderDate
                        ? new Date(item.review.nextReminderDate)
                        : null;
                      const today = new Date();
                      const diffDays = reviewDate
                        ? Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      return (
                        <div
                          key={`reminder-${i}-${item.review.id}`}
                          style={{
                            padding: '12px 14px',
                            borderBottom: i < upcomingRemindersData.length - 1 ? '1px solid #f3f4f6' : 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}
                          onClick={() => navigate('/checklist')}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>
                              {item.look ? `⭐ ${item.look.name}` : `📋 ${SceneLabels[item.review.scene]}清单`}
                            </div>
                            <span style={{
                              fontSize: 12,
                              padding: '2px 8px',
                              borderRadius: 10,
                              background: diffDays <= 0 ? '#fee2e2' : diffDays <= 3 ? '#fef3c7' : '#d1fae5',
                              color: diffDays <= 0 ? '#dc2626' : diffDays <= 3 ? '#d97706' : '#059669',
                            }}>
                              {diffDays < 0 ? '已过期' : diffDays === 0 ? '今天' : `${diffDays} 天后`}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                            📅 提醒日期：{reviewDate?.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                          </div>
                          {item.review.notes && (
                            <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>
                              💬 {item.review.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                    <div>暂无提醒</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>创建复盘时设置下次提醒日期即可</div>
                  </div>
                )}
              </div>
            </>
          )}

          {totalItems > 0 && (
            <div style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>📦 库存与效期管理</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div className="stat-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: healthColor }}>{healthScore}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>健康评分</div>
                  <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 10, background: `${healthColor}15`, color: healthColor, fontWeight: 600 }}>
                    {healthLabel}
                  </span>
                </div>
                <div className="stat-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#059669' }}>{inventoryStats?.inStockCount || 0}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>库存充足</div>
                </div>
                <div className="stat-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#d97706' }}>{inventoryStats?.lowStockCount || 0}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>库存偏低</div>
                </div>
                <div className="stat-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#dc2626' }}>{inventoryStats?.outOfStockCount || 0}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>已缺货</div>
                </div>
                <div className="stat-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#8b5cf6' }}>{inventoryStats?.essentialCount || 0}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>常备单品</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div className="chart-card">
                  <h3>📊 库存状态分布</h3>
                  {inventoryOverviewData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={inventoryOverviewData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                          isAnimationActive={false}
                        >
                          {inventoryOverviewData.map((entry, idx) => (
                            <Cell key={`inv-cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>暂无库存数据</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: '#dc2626', display: 'inline-block' }}></span>
                      已过期 {inventoryStats?.expiredCount || 0}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: '#d97706', display: 'inline-block' }}></span>
                      即将过期 {inventoryStats?.expiringSoonCount || 0}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: '#6b7280', display: 'inline-block' }}></span>
                      长期闲置 {inventoryStats?.longUnusedCount || 0}
                    </div>
                  </div>
                </div>

                <div className="chart-card">
                  <h3>⏰ 即将过期单品</h3>
                  {expiringSoonItems.length > 0 ? (
                    <div>
                      {expiringSoonItems.map((item, i) => (
                        <div key={`exp-${i}-${item.id}`} style={{
                          padding: '10px 12px',
                          borderBottom: i < expiringSoonItems.length - 1 ? '1px solid #f3f4f6' : 'none',
                          borderRadius: 8,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {CATEGORY_EMOJI[item.category]} {item.name}
                            </div>
                            <span style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 10,
                              background: item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 7 ? '#fee2e2' : '#fef3c7',
                              color: item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 7 ? '#dc2626' : '#d97706',
                              fontWeight: 600,
                            }}>
                              {item.daysUntilExpiry !== undefined ? (item.daysUntilExpiry <= 0 ? '已过期' : `剩${item.daysUntilExpiry}天`) : '-'}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>
                            {CategoryLabels[item.category]}{item.brand ? ` · ${item.brand}` : ''}
                            {item.expiryDate ? ` · 到期 ${new Date(item.expiryDate).toLocaleDateString('zh-CN')}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                      <div>暂无即将过期的单品</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="chart-card">
                  <h3>🛒 补货优先级排行</h3>
                  {restockPriority.length > 0 ? (
                    <div>
                      {restockPriority.map((item, i) => (
                        <div key={`restock-${i}-${item.id}`} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px 0',
                          borderBottom: i < restockPriority.length - 1 ? '1px solid #f3f4f6' : 'none',
                        }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 13, marginRight: 12, flexShrink: 0,
                            background: i === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : i === 1 ? 'linear-gradient(135deg, #d1d5db, #9ca3af)' : i === 2 ? 'linear-gradient(135deg, #fb923c, #ea580c)' : '#f3f4f6',
                            color: i < 3 ? 'white' : '#6b7280',
                          }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {CATEGORY_EMOJI[item.category]} {item.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>
                              {CategoryLabels[item.category]}{item.brand ? ` · ${item.brand}` : ''}
                              {item.remainingQuantity !== undefined ? ` · 剩余${item.remainingQuantity}` : ''}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {item.risks.map(risk => {
                              const cfg = RISK_CONFIG[risk];
                              return (
                                <span key={risk} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: `${cfg.color}15`, color: cfg.color, fontWeight: 600 }}>
                                  {cfg.emoji}{cfg.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                      <div>暂无需补货的单品</div>
                    </div>
                  )}
                </div>

                <div className="chart-card">
                  <h3>💤 长期闲置单品排行</h3>
                  {longUnusedItems.length > 0 ? (
                    <div>
                      {longUnusedItems.map((item, i) => (
                        <div key={`unused-${i}-${item.id}`} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px 0',
                          borderBottom: i < longUnusedItems.length - 1 ? '1px solid #f3f4f6' : 'none',
                        }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 13, marginRight: 12, flexShrink: 0,
                            background: i === 0 ? 'linear-gradient(135deg, #6b7280, #4b5563)' : '#f3f4f6',
                            color: i === 0 ? 'white' : '#6b7280',
                          }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {CATEGORY_EMOJI[item.category]} {item.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>
                              {CategoryLabels[item.category]}{item.brand ? ` · ${item.brand}` : ''}
                            </div>
                          </div>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f3f4f6', color: '#6b7280', fontWeight: 600 }}>
                            {item.daysSinceLastUse !== undefined ? `${item.daysSinceLastUse}天未用` : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
                      <div>暂无长期闲置单品</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </PageErrorBoundary>
      )}
    </div>
  );
}