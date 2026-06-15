import { useEffect, useState } from 'react';
import { itemsApi, AllItems } from '../api';
import type { LensItem, LipstickItem, BlushItem, OutfitItem, ItemCategory, LensType } from '../types';
import ItemForm from '../components/ItemForm';
import ItemCard from '../components/ItemCard';

type Tab = ItemCategory;

const EMOJI: Record<ItemCategory, string> = {
  lens: '👁️', lipstick: '💄', blush: '🌸', outfit: '👗',
};

export default function ItemsPage() {
  const [tab, setTab] = useState<Tab>('lens');
  const [data, setData] = useState<AllItems | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setData(await itemsApi.getAll()); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (category: ItemCategory, payload: any) => {
    if (editItem) {
      const fn: any = { lens: itemsApi.updateLens, lipstick: itemsApi.updateLipstick, blush: itemsApi.updateBlush, outfit: itemsApi.updateOutfit }[category];
      await fn(editItem.id, payload);
    } else {
      const fn: any = { lens: itemsApi.addLens, lipstick: itemsApi.addLipstick, blush: itemsApi.addBlush, outfit: itemsApi.addOutfit }[category];
      await fn(payload);
    }
    setShowModal(false);
    setEditItem(null);
    load();
  };

  const handleDelete = async (category: ItemCategory, id: string) => {
    if (!confirm('确认删除该单品？')) return;
    await itemsApi.delete(category, id);
    load();
  };

  const getList = () => {
    if (!data) return [];
    const map: Record<ItemCategory, any[]> = { lens: data.lenses, lipstick: data.lipsticks, blush: data.blushes, outfit: data.outfits };
    return map[tab];
  };

  const count = data ? { lens: data.lenses.length, lipstick: data.lipsticks.length, blush: data.blushes.length, outfit: data.outfits.length } : null;

  return (
    <div>
      <div className="section-header">
        <h1 className="page-title">📦 单品档案</h1>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowModal(true); }}>
          + 新增 {tab === 'lens' ? '美瞳' : tab === 'lipstick' ? '口红' : tab === 'blush' ? '腮红' : '服饰'}
        </button>
      </div>

      <div className="tabs">
        {(['lens', 'lipstick', 'blush', 'outfit'] as Tab[]).map(t => (
          <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {EMOJI[t]} {t === 'lens' ? '美瞳' : t === 'lipstick' ? '口红' : t === 'blush' ? '腮红' : '服饰'}
            {count && <span style={{ marginLeft: 6, color: tab === t ? '#db2777' : '#9ca3af' }}>({count[t]})</span>}
          </div>
        ))}
      </div>

      {loading && <div className="empty"><div className="emoji">⏳</div><p>加载中...</p></div>}

      {!loading && getList().length === 0 && (
        <div className="empty">
          <div className="emoji">{EMOJI[tab]}</div>
          <p>还没有添加{tab === 'lens' ? '美瞳' : tab === 'lipstick' ? '口红' : tab === 'blush' ? '腮红' : '服饰'}，点击右上角新增吧~</p>
        </div>
      )}

      <div className="grid">
        {getList().map((item: any) => (
          <ItemCard
            key={item.id}
            item={item}
            category={tab}
            onEdit={() => { setEditItem(item); setShowModal(true); }}
            onDelete={() => handleDelete(tab, item.id)}
          />
        ))}
      </div>

      {showModal && (
        <ItemForm
          category={tab}
          initial={editItem}
          onSave={handleSave}
          onCancel={() => { setShowModal(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}