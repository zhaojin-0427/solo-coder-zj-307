import type { ItemCategory, RiskType } from '../types';

interface Props {
  item: any;
  category: ItemCategory;
  onEdit: () => void;
  onDelete: () => void;
}

const EMOJI: Record<ItemCategory, string> = {
  lens: '👁️', lipstick: '💄', blush: '🌸', outfit: '👗',
};

const TAG_COLORS = ['pink', 'purple', 'blue', 'green'];

const RISK_CONFIG: Record<RiskType, { label: string; color: string; emoji: string }> = {
  expired: { label: '已过期', color: '#dc2626', emoji: '⚠️' },
  expiring_soon: { label: '即将过期', color: '#d97706', emoji: '⏰' },
  low_stock: { label: '库存不足', color: '#ea580c', emoji: '📦' },
  long_unused: { label: '长期闲置', color: '#6b7280', emoji: '💤' },
};

export default function ItemCard({ item, category, onEdit, onDelete }: Props) {
  const tagColor = (i: number) => TAG_COLORS[i % TAG_COLORS.length];

  const risks: RiskType[] = item.riskInfo?.risks || [];

  const renderMeta = () => {
    switch (category) {
      case 'lens':
        return (
          <>
            <div>直径: {item.diameter}mm · {item.lensType === 'daily' ? '日抛' : item.lensType === 'monthly' ? '月抛' : '年抛'}</div>
            <div>颜色: {item.color}</div>
          </>
        );
      case 'lipstick':
        return (
          <>
            <div>色号: {item.color}</div>
            <div>质地: {item.finish}</div>
          </>
        );
      case 'blush':
        return (
          <>
            <div>色号: {item.color}</div>
            <div>质地: {item.texture}</div>
          </>
        );
      case 'outfit':
        return (
          <>
            <div>类型: {item.type}</div>
            <div>季节: {item.season?.join(' / ') || '-'}</div>
          </>
        );
    }
  };

  const renderStockInfo = () => {
    if (!item.stockStatus && item.remainingQuantity === undefined && !item.purchaseDate && !item.openDate && !item.storageLocation && !item.isEssential) return null;
    const parts: string[] = [];
    const statusText = item.stockStatus === 'in_stock' ? '库存充足' :
      item.stockStatus === 'low_stock' ? '库存偏低' :
      item.stockStatus === 'out_of_stock' ? '已缺货' : null;
    if (statusText) parts.push(statusText);
    if (item.remainingQuantity !== undefined) parts.push(`剩${item.remainingQuantity}`);
    if (item.openDate) {
      const openDateStr = new Date(item.openDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      parts.push(`开封${openDateStr}`);
    }
    if (item.purchaseDate && !item.openDate) {
      const purchaseDateStr = new Date(item.purchaseDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      parts.push(`购入${purchaseDateStr}`);
    }
    if (item.riskInfo?.expiryDate) {
      const expiryStr = new Date(item.riskInfo.expiryDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      const daysLeft = item.riskInfo.daysUntilExpiry;
      if (daysLeft !== undefined) {
        parts.push(daysLeft <= 0 ? `已过期` : `到期${expiryStr}`);
      }
    }
    if (item.storageLocation) parts.push(`📍${item.storageLocation}`);
    return (
      <div className="meta" style={{ color: '#6b7280', fontSize: 12 }}>
        📦 {parts.join(' · ')}
        {item.isEssential && (
          <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 6, background: '#ede9fe', color: '#6d28d9', fontWeight: 600 }}>
            常备
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="card item-card" style={{
      borderColor: risks.includes('expired') ? '#fecaca' :
        risks.includes('expiring_soon') ? '#fed7aa' : undefined,
      boxShadow: risks.length > 0 ? '0 2px 8px rgba(0,0,0,0.06)' : undefined,
    }}>
      {risks.length > 0 && (
        <div className="risk-tags" style={{ marginBottom: 8 }}>
          {risks.map(risk => {
            const cfg = RISK_CONFIG[risk];
            return (
              <span
                key={risk}
                className="risk-tag"
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: `${cfg.color}15`,
                  color: cfg.color,
                  fontWeight: 600,
                  marginRight: 4,
                  marginBottom: 4,
                }}
              >
                {cfg.emoji} {cfg.label}
              </span>
            );
          })}
        </div>
      )}
      <div className="emoji">{EMOJI[category]}</div>
      <h3>{item.name}</h3>
      <div className="brand">{item.brand || item.color}</div>
      <div className="tags">
        {(item.style || []).map((s: string, i: number) => (
          <span key={s} className={`tag ${tagColor(i)}`}>{s}</span>
        ))}
      </div>
      <div className="meta">{renderMeta()}</div>
      {renderStockInfo()}
      {item.notes && <div className="meta" style={{ marginTop: 8, color: '#6b7280' }}>📝 {item.notes}</div>}
      <div className="actions">
        <button className="btn btn-secondary btn-sm" onClick={onEdit}>编辑</button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>删除</button>
      </div>
    </div>
  );
}