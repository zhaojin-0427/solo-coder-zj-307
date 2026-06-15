import type { ItemCategory } from '../types';

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

export default function ItemCard({ item, category, onEdit, onDelete }: Props) {
  const tagColor = (i: number) => TAG_COLORS[i % TAG_COLORS.length];

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

  return (
    <div className="card item-card">
      <div className="emoji">{EMOJI[category]}</div>
      <h3>{item.name}</h3>
      <div className="brand">{item.brand || item.color}</div>
      <div className="tags">
        {(item.style || []).map((s: string, i: number) => (
          <span key={s} className={`tag ${tagColor(i)}`}>{s}</span>
        ))}
      </div>
      <div className="meta">{renderMeta()}</div>
      {item.notes && <div className="meta" style={{ marginTop: 8, color: '#6b7280' }}>📝 {item.notes}</div>}
      <div className="actions">
        <button className="btn btn-secondary btn-sm" onClick={onEdit}>编辑</button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>删除</button>
      </div>
    </div>
  );
}