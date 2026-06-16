import { useEffect, useState, useMemo } from 'react';
import { itemsApi, AllItemsWithRisk } from '../api';
import type { LensItem, LipstickItem, BlushItem, OutfitItem, ItemCategory, LensType, RiskType } from '../types';
import ItemForm from '../components/ItemForm';
import ItemCard from '../components/ItemCard';

type Tab = ItemCategory;

const EMOJI: Record<ItemCategory, string> = {
  lens: '👁️', lipstick: '💄', blush: '🌸', outfit: '👗',
};

const RISK_FILTER_OPTIONS: { value: RiskType | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: '全部', emoji: '📋' },
  { value: 'expired', label: '已过期', emoji: '⚠️' },
  { value: 'expiring_soon', label: '即将过期', emoji: '⏰' },
  { value: 'low_stock', label: '库存不足', emoji: '📦' },
  { value: 'long_unused', label: '长期闲置', emoji: '💤' },
];

export default function ItemsPage() {
  const [tab, setTab] = useState<Tab>('lens');
  const [data, setData] = useState<AllItemsWithRisk | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [riskFilter, setRiskFilter] = useState<RiskType | 'all'>('all');

  const load = async () => {
    setLoading(true);
    try { setData(await itemsApi.getAllWithRisk()); } finally { setLoading(false); }
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
    let list = map[tab];
    if (riskFilter !== 'all') {
      list = list.filter(item => item.riskInfo?.risks?.includes(riskFilter));
    }
    return list;
  };

  const count = data ? { lens: data.lenses.length, lipstick: data.lipsticks.length, blush: data.blushes.length, outfit: data.outfits.length } : null;

  const riskCounts = useMemo(() => {
    const counts: Record<RiskType | 'all', number> = { all: 0, expired: 0, expiring_soon: 0, low_stock: 0, long_unused: 0 };
    if (!data) return counts;
    const allItems = [...data.lenses, ...data.lipsticks, ...data.blushes, ...data.outfits];
    counts.all = allItems.length;
    allItems.forEach(item => {
      const risks = item.riskInfo?.risks || [];
      if (risks.includes('expired')) counts.expired++;
      if (risks.includes('expiring_soon')) counts.expiring_soon++;
      if (risks.includes('low_stock')) counts.low_stock++;
      if (risks.includes('long_unused')) counts.long_unused++;
    });
    return counts;
  }, [data]);

  const tabRiskCounts = useMemo(() => {
    if (!data) return { expired: 0, expiring_soon: 0, low_stock: 0, long_unused: 0 };
    const map: Record<ItemCategory, any[]> = { lens: data.lenses, lipstick: data.lipsticks, blush: data.blushes, outfit: data.outfits };
    const list = map[tab];
    const counts = { expired: 0, expiring_soon: 0, low_stock: 0, long_unused: 0 };
    list.forEach(item => {
      const risks = item.riskInfo?.risks || [];
      if (risks.includes('expired')) counts.expired++;
      if (risks.includes('expiring_soon')) counts.expiring_soon++;
      if (risks.includes('low_stock')) counts.low_stock++;
      if (risks.includes('long_unused')) counts.long_unused++;
    });
    return counts;
  }, [data, tab]);

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

      <div className="risk-filter-bar" style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
        padding: 12,
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      }}>
        {RISK_FILTER_OPTIONS.map(opt => {
          const count = opt.value === 'all' ? riskCounts.all : (tabRiskCounts as any)[opt.value];
          const active = riskFilter === opt.value;
          return (
            <div
              key={opt.value}
              onClick={() => setRiskFilter(opt.value)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.2s',
                background: active ? 'linear-gradient(135deg, #db2777, #8b5cf6)' : '#f9fafb',
                color: active ? 'white' : (count > 0 ? '#374151' : '#9ca3af'),
                border: active ? 'none' : '1px solid #e5e7eb',
                boxShadow: active ? '0 2px 10px rgba(219,39,119,0.25)' : 'none',
              }}
            >
              {opt.emoji} {opt.label}
              <span style={{
                marginLeft: 6,
                padding: '1px 8px',
                borderRadius: 10,
                fontSize: 11,
                background: active ? 'rgba(255,255,255,0.25)' : (count > 0 ? '#fee2e2' : '#f3f4f6'),
                color: active ? 'white' : (count > 0 ? '#dc2626' : '#9ca3af'),
                fontWeight: 600,
              }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {loading && <div className="empty"><div className="emoji">⏳</div><p>加载中...</p></div>}

      {!loading && getList().length === 0 && (
        <div className="empty">
          <div className="emoji">{riskFilter !== 'all' ? '🔍' : EMOJI[tab]}</div>
          <p>
            {riskFilter !== 'all'
              ? `当前分类下没有「${RISK_FILTER_OPTIONS.find(o => o.value === riskFilter)?.label}」的单品`
              : `还没有添加${tab === 'lens' ? '美瞳' : tab === 'lipstick' ? '口红' : tab === 'blush' ? '腮红' : '服饰'}，点击右上角新增吧~`}
          </p>
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