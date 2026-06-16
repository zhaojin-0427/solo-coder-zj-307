import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { savedLooksApi, itemsApi, checklistApi, reviewApi } from '../api';
import type { SavedLook, AllItems, SceneType, LookReviewSummary } from '../types';
import { SceneLabels } from '../types';

export default function SavedLooksPage() {
  const navigate = useNavigate();
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [items, setItems] = useState<AllItems | null>(null);
  const [filter, setFilter] = useState<SceneType | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [editLook, setEditLook] = useState<SavedLook | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [reviewSummaries, setReviewSummaries] = useState<LookReviewSummary[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [looksData, itemsData, summariesData] = await Promise.all([
        savedLooksApi.getAll(),
        itemsApi.getAll(),
        reviewApi.getLookSummaries(),
      ]);
      setLooks(looksData);
      setItems(itemsData);
      setReviewSummaries(summariesData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const findItem = (id?: string, category: 'lens' | 'lipstick' | 'blush' | 'outfit' = 'lens') => {
    if (!id || !items) return null;
    const map: any = { lens: items.lenses, lipstick: items.lipsticks, blush: items.blushes, outfit: items.outfits };
    return map[category].find((i: any) => i.id === id);
  };

  const filtered = filter === 'all' ? looks : looks.filter(l => l.scene === filter);

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该收藏方案？')) return;
    await savedLooksApi.delete(id);
    load();
  };

  const createChecklist = async (look: SavedLook) => {
    try {
      const templates = await checklistApi.getTemplates();
      const items = templates.map(t => ({ checklistItemId: t.id, checked: !t.essential }));
      const checklist = await checklistApi.create({
        lookId: look.id,
        scene: look.scene,
        items,
      });
      navigate('/checklist', { state: { newChecklistId: checklist.id } });
    } catch (e) {
      alert('创建清单失败');
    }
  };

  const startEdit = (look: SavedLook) => {
    setEditLook(look);
    setEditName(look.name);
    setEditDesc(look.description);
  };

  const saveEdit = async () => {
    if (!editLook) return;
    await savedLooksApi.update(editLook.id, { name: editName, description: editDesc });
    setEditLook(null);
    load();
  };

  return (
    <div>
      <h1 className="page-title">⭐ 方案收藏</h1>

      <div className="tabs">
        <div className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          全部 ({looks.length})
        </div>
        {(['commute', 'date', 'photo', 'travel'] as SceneType[]).map(s => {
          const c = looks.filter(l => l.scene === s).length;
          return (
            <div key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {SceneLabels[s]} ({c})
            </div>
          );
        })}
      </div>

      {loading && <div className="empty"><div className="emoji">⏳</div><p>加载中...</p></div>}

      {!loading && filtered.length === 0 && (
        <div className="empty"><div className="emoji">⭐</div><p>还没有收藏的方案，去场景搭配页面收藏喜欢的方案吧~</p></div>
      )}

      <div className="grid">
        {filtered.map(s => {
          const lens = findItem(s.items.lensId, 'lens');
          const lip = findItem(s.items.lipstickId, 'lipstick');
          const blush = findItem(s.items.blushId, 'blush');
          const outfit = findItem(s.items.outfitId, 'outfit');
          const summary = reviewSummaries.find(sum => sum.lookId === s.id);

          return (
            <div key={s.id} className="card item-card suggestion-card">
              <div className="score">🔁 {s.useCount || 0}次</div>
              <div style={{ fontSize: 12, color: '#8b5cf6', marginBottom: 4 }}>
                {SceneLabels[s.scene]}
              </div>
              <h3>{s.name}</h3>
              <div className="brand" style={{ color: '#6b7280' }}>{s.description}</div>
              <div className="tags">
                {s.style.map((t, i) => (
                  <span key={t} className={`tag ${['pink', 'purple', 'blue', 'green'][i % 4]}`}>{t}</span>
                ))}
              </div>
              {summary && summary.reviewCount > 0 && (
                <div style={{ marginTop: 10, padding: 10, background: 'linear-gradient(135deg, #fef3c7, #fce7f3)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>用户评价</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#db2777' }}>
                      ⭐ {summary.averageScore.toFixed(1)}
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginLeft: 4 }}>
                        ({summary.reviewCount}次)
                      </span>
                    </span>
                  </div>
                  {summary.latestReview && (
                    <div style={{ fontSize: 11, color: '#78350f', lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        最近复盘：{new Date(summary.latestReview.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                      {summary.latestReview.notes && (
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          "{summary.latestReview.notes}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="items-list">
                <div className="row"><span className="label">👁️ 美瞳</span><span>{lens?.name || '-'}</span></div>
                <div className="row"><span className="label">💄 口红</span><span>{lip?.name || '-'}</span></div>
                <div className="row"><span className="label">🌸 腮红</span><span>{blush?.name || '-'}</span></div>
                <div className="row"><span className="label">👗 服饰</span><span>{outfit?.name || '-'}</span></div>
              </div>
              <div className="actions">
                <button className="btn btn-primary btn-sm" onClick={() => createChecklist(s)}>📋 生成清单</button>
                <button className="btn btn-secondary btn-sm" onClick={() => startEdit(s)}>✏️ 编辑</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>删除</button>
              </div>
            </div>
          );
        })}
      </div>

      {editLook && (
        <div className="modal-backdrop" onClick={() => setEditLook(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>编辑收藏方案</h2>
            <div className="form-group">
              <label>名称</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
            </div>
            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setEditLook(null)}>取消</button>
              <button className="btn btn-primary" onClick={saveEdit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}