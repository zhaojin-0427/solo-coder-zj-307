import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { suggestApi, itemsApi, savedLooksApi, checklistApi } from '../api';
import type { SceneType, LookSuggestion, AllItems } from '../types';
import { SceneLabels } from '../types';

const SCENE_CONFIG: { scene: SceneType; emoji: string; name: string }[] = [
  { scene: 'commute', emoji: '💼', name: '通勤' },
  { scene: 'date', emoji: '💕', name: '约会' },
  { scene: 'photo', emoji: '📸', name: '拍照' },
  { scene: 'travel', emoji: '✈️', name: '旅行' },
];

export default function SuggestPage() {
  const navigate = useNavigate();
  const [scene, setScene] = useState<SceneType>('commute');
  const [suggestions, setSuggestions] = useState<LookSuggestion[]>([]);
  const [items, setItems] = useState<AllItems | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [itemsData, sugData] = await Promise.all([
        itemsApi.getAll(),
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
      // Save look first then link
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

          return (
            <div key={s.id} className="card item-card suggestion-card">
              <div className="score">🎯 {Math.round(s.score * 100)}分</div>
              <h3>{s.name}</h3>
              <div className="brand" style={{ color: '#8b5cf6' }}>{s.description}</div>
              <div className="tags">
                {s.style.map((t, i) => (
                  <span key={t} className={`tag ${['pink', 'purple', 'blue', 'green'][i % 4]}`}>{t}</span>
                ))}
              </div>
              <div className="items-list">
                <div className="row"><span className="label">👁️ 美瞳</span><span>{lens?.name || '-'}</span></div>
                <div className="row"><span className="label">💄 口红</span><span>{lip?.name || '-'}</span></div>
                <div className="row"><span className="label">🌸 腮红</span><span>{blush?.name || '-'}</span></div>
                <div className="row"><span className="label">👗 服饰</span><span>{outfit?.name || '-'}</span></div>
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