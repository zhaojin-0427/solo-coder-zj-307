import { useEffect, useState } from 'react';
import { statsApi, itemsApi, savedLooksApi } from '../api';
import type { Stats, AllItems, SavedLook, SceneType } from '../types';
import { SceneLabels } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const COLORS = ['#db2777', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

const SCENE_COLORS: Record<SceneType, string> = {
  commute: '#3b82f6',
  date: '#db2777',
  photo: '#8b5cf6',
  travel: '#10b981',
};

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<AllItems | null>(null);
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, i, l] = await Promise.all([statsApi.get(), itemsApi.getAll(), savedLooksApi.getAll()]);
      setStats(s);
      setItems(i);
      setLooks(l);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const findItem = (id?: string, category: 'lens' | 'lipstick' | 'blush' | 'outfit' = 'lens') => {
    if (!id || !items) return '-';
    const map: any = { lens: items.lenses, lipstick: items.lipsticks, blush: items.blushes, outfit: items.outfits };
    const found = map[category].find((x: any) => x.id === id);
    return found?.name || '-';
  };

  const pieData = stats?.sceneDistribution.map(s => ({
    name: SceneLabels[s.scene],
    value: s.count,
    color: SCENE_COLORS[s.scene],
  })) || [];

  const totalItems = items ? items.lenses.length + items.lipsticks.length + items.blushes.length + items.outfits.length : 0;

  return (
    <div>
      <h1 className="page-title">📊 统计分析</h1>

      {loading && <div className="empty"><div className="emoji">⏳</div><p>加载统计中...</p></div>}

      {!loading && (
        <>
          {/* 总览卡片 */}
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
                {/* 场景占比 */}
                <div className="chart-card">
                  <h3>各场景使用占比</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                      >
                        {pieData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  {pieData.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>暂无数据</div>
                  )}
                </div>

                {/* 高频组合 */}
                <div className="chart-card">
                  <h3>高频搭配组合 Top 5</h3>
                  {stats && stats.topCombinations.length > 0 ? (
                    <div>
                      {stats.topCombinations.slice(0, 5).map((c, i) => (
                        <div key={i} style={{ padding: '10px 0', borderBottom: i < Math.min(stats.topCombinations.length, 5) - 1 ? '1px solid #f3f4f6' : 'none' }}>
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
                            👁️ {findItem(c.combination.lensId, 'lens')} ·
                            💄 {findItem(c.combination.lipstickId, 'lipstick')} ·
                            🌸 {findItem(c.combination.blushId, 'blush')} ·
                            👗 {findItem(c.combination.outfitId, 'outfit')}
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
                {/* 遗漏物品排行 */}
                <div className="chart-card">
                  <h3>遗漏物品排行</h3>
                  {stats && stats.missedItemsRank.length > 0 ? (
                    <div>
                      {stats.missedItemsRank.map((m, i) => (
                        <div className="rank-item" key={i}>
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

                {/* 风格复用率 */}
                <div className="chart-card">
                  <h3>不同风格复用率</h3>
                  {stats && stats.styleReuseRate.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={stats.styleReuseRate} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                        <YAxis type="category" dataKey="style" stroke="#9ca3af" fontSize={12} width={80} />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            value,
                            name === 'reuseRate' ? '复用率' : name === 'totalUsed' ? '总使用' : '方案数'
                          ]}
                        />
                        <Bar dataKey="reuseRate" fill="#db2777" radius={[0, 6, 6, 0]} name="复用率" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>暂无数据</div>
                  )}
                </div>
              </div>

              {/* 场景详细分布条 */}
              {(stats?.sceneDistribution || []).filter(s => s.count > 0).length > 0 && (
                <div className="chart-card">
                  <h3>场景使用次数</h3>
                  {(stats?.sceneDistribution || []).filter(s => s.count > 0).map(s => (
                    <div className="bar-row" key={s.scene}>
                      <div className="name">
                        {s.scene === 'commute' ? '💼' : s.scene === 'date' ? '💕' : s.scene === 'photo' ? '📸' : '✈️'}
                        {' '}{SceneLabels[s.scene]}
                      </div>
                      <div className="bar">
                        <div className="fill" style={{
                          width: `${Math.max(s.percentage, s.count > 0 ? 10 : 0)}%`,
                          background: `linear-gradient(90deg, ${SCENE_COLORS[s.scene]}, #8b5cf6)`
                        }}></div>
                      </div>
                      <div className="count">{s.count} 次 ({s.percentage}%)</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}