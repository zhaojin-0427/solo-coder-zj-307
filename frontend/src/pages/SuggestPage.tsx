import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { suggestApi, itemsApi, savedLooksApi, checklistApi, AllItemsWithRisk } from '../api';
import type { SceneType, LookSuggestion, RiskType } from '../types';
import { SceneLabels } from '../types';

const SCENE_CONFIG: { scene: SceneType; emoji: string; name: string }[] = [
  { scene: 'commute', emoji: '💼', name: '通勤' },
  { scene: 'date', emoji: '💕', name: '约会' },
  { scene: 'photo', emoji: '📸', name: '拍照' },
  { scene: 'travel', emoji: '✈️', name: '旅行' },
];

const RISK_CONFIG: Record<RiskType, { label: string; color: string; emoji: string }> = {
  expired: { label: '已过期', color: '#dc2626', emoji: '⚠️' },
  expiring_soon: { label: '即将过期', color: '#d97706', emoji: '⏰' },
  low_stock: { label: '库存不足', color: '#ea580c', emoji: '📦' },
  long_unused: { label: '长期闲置', color: '#6b7280', emoji: '💤' },
};

export default function SuggestPage() {
  const navigate = useNavigate();
  const [scene, setScene] = useState<SceneType>('commute');
  const [suggestions, setSuggestions] = useState<LookSuggestion[]>([]);
  const [items, setItems] = useState<AllItemsWithRisk | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [itemsData, sugData] = await Promise.all([
        itemsApi.getAllWithRisk(),
        suggestApi.generate(scene),
      ]);
      setItems(itemsData);
      setSuggestions(sugData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [scene]);

  const findItem = (id?: string, category: 'lens' | 'lipstick' | 'blush' | 'outfit' = 'lens') => {
    if (!id || !items) return null;
    const map: any = { lens: items.lenses, lipstick: items.lipsticks, blush: items.blushes, outfit: items.outfits };
    return map[category].find((i: any) => i.id === id);
  };

  const saveSuggestion = async (s: LookSuggestion) => {
    try {
      await savedLooksApi.save({
        name: s.name,
        scene: s.scene,
        items: s.items,
        description: s.description,
        style: s.style,
      });
      alert('✅ 已收藏该方案！');
    } catch (e) {
      alert('收藏失败');
    }
  };

  const createChecklist = async (s: LookSuggestion) => {
    try {
      const templates = await checklistApi.getTemplates();
      const items = templates.map(t => ({ checklistItemId: t.id, checked: !t.essential }));
      const checklist = await checklistApi.create({
        scene: s.scene,
        items,
      });
      const saved = await savedLooksApi.save({
        name: s.name,
        scene: s.scene,
        items: s.items,
        description: s.description,
        style: s.style,
      });
      await checklistApi.update(checklist.id, { lookId: saved.id });
      navigate('/checklist', { state: { newChecklistId: checklist.id } });
    } catch (e) {
      alert('创建清单失败');
    }
  };

  const getItemRisks = (item: any): RiskType[] => {
    return item?.riskInfo?.risks || [];
  };

  const hasSeriousRisks = (s: LookSuggestion) => {
    const lens = findItem(s.items.lensId, 'lens');
    const lip = findItem(s.items.lipstickId, 'lipstick');
    const blush = findItem(s.items.blushId, 'blush');
    const outfit = findItem(s.items.outfitId, 'outfit');
    const allItems = [lens, lip, blush, outfit].filter(Boolean);
    return allItems.some(item => {
      const risks = getItemRisks(item);
      return risks.includes('expired') || risks.includes('low_stock');
    });
  };

  const getSeriousRiskText = (s: LookSuggestion) => {
    const warnings: string[] = [];
    const lens = findItem(s.items.lensId, 'lens');
    const lip = findItem(s.items.lipstickId, 'lipstick');
    const blush = findItem(s.items.blushId, 'blush');
    const outfit = findItem(s.items.outfitId, 'outfit');
    const check = (item: any, name: string) => {
      if (!item) return;
      const risks = getItemRisks(item);
      if (risks.includes('expired')) warnings.push(`${name}已过期`);
      if (risks.includes('low_stock') && item.stockStatus === 'out_of_stock') warnings.push(`${name}已缺货`);
      else if (risks.includes('low_stock')) warnings.push(`${name}库存不足`);
    };
    check(lens, '美瞳');
    check(lip, '口红');
    check(blush, '腮红');
    check(outfit, '服饰');
    return warnings.join('、');
  };

  const renderRiskTags = (item: any) => {
    const risks = getItemRisks(item);
    if (risks.length === 0) return null;
    return (
      <div style={{ marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {risks.map(risk => {
          const cfg = RISK_CONFIG[risk];
          return (
            <span
              key={risk}
              style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 8,
                background: `${cfg.color}15`,
                color: cfg.color,
                fontWeight: 600,
              }}
            >
              {cfg.emoji}{cfg.label}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <h1 className="page-title">🎨 场景搭配推荐</h1>

      <div className="scene-select">
        {SCENE_CONFIG.map(c => (
          <div
            key={c.scene}
            className={`scene-card ${scene === c.scene ? 'active' : ''}`}
            onClick={() => setScene(c.scene)}
          >
            <div className="emoji">{c.emoji}</div>
            <div className="name">{c.name}</div>
          </div>
        ))}
      </div>

      <div className="section-header" style={{ marginTop: 28 }}>
        <h2>为「{SceneLabels[scene]}」推荐以下搭配</h2>
        <button className="btn btn-secondary btn-sm" onClick={load}>🔄 换一批</button>
      </div>

      {loading && <div className="empty"><div className="emoji">✨</div><p>正在为你生成搭配方案...</p></div>}

      {!loading && suggestions.length === 0 && (
        <div className="empty"><div className="emoji">😅</div><p>暂无推荐，请先添加单品档案</p></div>
      )}

      <div className="grid">
        {suggestions.map(s => {
          const lens = findItem(s.items.lensId, 'lens');
          const lip = findItem(s.items.lipstickId, 'lipstick');
          const blush = findItem(s.items.blushId, 'blush');
          const outfit = findItem(s.items.outfitId, 'outfit');
          const seriousRisk = hasSeriousRisks(s);
          const seriousRiskText = getSeriousRiskText(s);

          return (
            <div key={s.id} className="card item-card suggestion-card" style={{
              borderColor: seriousRisk ? '#fecaca' : undefined,
              background: seriousRisk ? 'linear-gradient(135deg, #fff1f2 0%, #fef2f2 100%)' : undefined,
            }}>
              <div className="score">🎯 {Math.round(s.score * 100)}分</div>
              <h3>{s.name}</h3>
              <div className="brand" style={{ color: '#8b5cf6' }}>{s.description}</div>
              <div className="tags">
                {s.style.map((t, i) => (
                  <span key={t} className={`tag ${['pink', 'purple', 'blue', 'green'][i % 4]}`}>{t}</span>
                ))}
              </div>
              {seriousRisk && (
                <div style={{
                  marginTop: 10,
                  padding: '8px 10px',
                  background: '#fef2f2',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#dc2626',
                  fontWeight: 500,
                  border: '1px solid #fecaca',
                }}>
                  ⚠️ {seriousRiskText}，建议更换单品
                </div>
              )}
              <div className="items-list">
                <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex' }}>
                    <span className="label">👁️ 美瞳</span>
                    <span style={{ flex: 1 }}>{lens?.name || '-'}</span>
                  </div>
                  {renderRiskTags(lens)}
                </div>
                <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex' }}>
                    <span className="label">💄 口红</span>
                    <span style={{ flex: 1 }}>{lip?.name || '-'}</span>
                  </div>
                  {renderRiskTags(lip)}
                </div>
                <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex' }}>
                    <span className="label">🌸 腮红</span>
                    <span style={{ flex: 1 }}>{blush?.name || '-'}</span>
                  </div>
                  {renderRiskTags(blush)}
                </div>
                <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex' }}>
                    <span className="label">👗 服饰</span>
                    <span style={{ flex: 1 }}>{outfit?.name || '-'}</span>
                  </div>
                  {renderRiskTags(outfit)}
                </div>
              </div>
              <div className="actions">
                <button className="btn btn-primary btn-sm" onClick={() => saveSuggestion(s)}>⭐ 收藏</button>
                <button className="btn btn-secondary btn-sm" onClick={() => createChecklist(s)}>📋 生成清单</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}