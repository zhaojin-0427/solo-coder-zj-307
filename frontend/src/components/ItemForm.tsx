import { useState, useEffect } from 'react';
import type { ItemCategory, LensType, StockStatus } from '../types';

interface Props {
  category: ItemCategory;
  initial: any;
  onSave: (category: ItemCategory, payload: any) => void;
  onCancel: () => void;
}

const STYLE_OPTIONS = ['自然', '通勤', '职业', '甜美', '约会', '温柔', '精致', '混血', '复古', '酷', '拍照', '旅行', '清新', '活力', '低调'];
const SEASON_OPTIONS = ['春', '夏', '秋', '冬'];

const STOCK_STATUS_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: 'in_stock', label: '库存充足' },
  { value: 'low_stock', label: '库存偏低' },
  { value: 'out_of_stock', label: '已缺货' },
];

export default function ItemForm({ category, initial, onSave, onCancel }: Props) {
  const [activeTab, setActiveTab] = useState<'basic' | 'inventory'>('basic');

  const [form, setForm] = useState<any>({
    name: '', brand: '', style: [], notes: '',
    stockStatus: 'in_stock' as StockStatus,
    purchaseDate: '',
    openDate: '',
    shelfLifeDays: undefined as number | undefined,
    remainingQuantity: undefined as number | undefined,
    storageLocation: '',
    isEssential: false,
    ...(category === 'lens' ? { color: '', diameter: 14.2, lensType: 'daily' as LensType } : {}),
    ...(category === 'lipstick' ? { color: '', finish: '哑光' } : {}),
    ...(category === 'blush' ? { color: '', texture: '粉状' } : {}),
    ...(category === 'outfit' ? { type: '', color: '', season: [] } : {}),
  });

  useEffect(() => {
    if (initial) setForm({ ...form, ...initial });
    // eslint-disable-next-line
  }, [initial, category]);

  const update = (key: string, value: any) => setForm({ ...form, [key]: value });

  const toggleArray = (key: string, value: string) => {
    const current = form[key] || [];
    if (current.includes(value)) update(key, current.filter((v: string) => v !== value));
    else update(key, [...current, value]);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { alert('请填写名称'); return; }
    const payload = { ...form };
    if (payload.shelfLifeDays === '' || payload.shelfLifeDays === null) {
      delete payload.shelfLifeDays;
    }
    if (payload.remainingQuantity === '' || payload.remainingQuantity === null) {
      delete payload.remainingQuantity;
    }
    onSave(category, payload);
  };

  const title = (category === 'lens' ? '美瞳' : category === 'lipstick' ? '口红' : category === 'blush' ? '腮红' : '服饰');

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <h2>{initial ? '编辑' : '新增'}{title}</h2>

        <div className="tabs" style={{ marginBottom: 20 }}>
          <div
            className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
            style={{ flex: 1, textAlign: 'center' }}
          >
            基本信息
          </div>
          <div
            className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
            style={{ flex: 1, textAlign: 'center' }}
          >
            库存与效期
          </div>
        </div>

        {activeTab === 'basic' && (
          <>
            <div className="form-group">
              <label>名称 *</label>
              <input value={form.name} onChange={e => update('name', e.target.value)} placeholder={`例如：自然棕日抛`} />
            </div>

        {category !== 'outfit' && (
          <div className="form-group">
            <label>品牌</label>
            <input value={form.brand || ''} onChange={e => update('brand', e.target.value)} placeholder="例如：海昌" />
          </div>
        )}

        {category === 'lens' && (
          <>
            <div className="form-group">
              <label>颜色</label>
              <input value={form.color} onChange={e => update('color', e.target.value)} placeholder="例如：棕色" />
            </div>
            <div className="form-group">
              <label>直径 (mm)</label>
              <input type="number" step="0.1" value={form.diameter} onChange={e => update('diameter', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>使用周期</label>
              <select value={form.lensType} onChange={e => update('lensType', e.target.value as LensType)}>
                <option value="daily">日抛</option>
                <option value="monthly">月抛</option>
                <option value="yearly">年抛</option>
              </select>
            </div>
          </>
        )}

        {(category === 'lipstick' || category === 'blush') && (
          <div className="form-group">
            <label>色号</label>
            <input value={form.color} onChange={e => update('color', e.target.value)} placeholder="例如：豆沙粉" />
          </div>
        )}

        {category === 'lipstick' && (
          <div className="form-group">
            <label>质地</label>
            <select value={form.finish} onChange={e => update('finish', e.target.value)}>
              <option>哑光</option><option>缎面</option><option>水润</option><option>玻璃唇</option><option>丝绒</option>
            </select>
          </div>
        )}

        {category === 'blush' && (
          <div className="form-group">
            <label>质地</label>
            <select value={form.texture} onChange={e => update('texture', e.target.value)}>
              <option>粉状</option><option>膏状</option><option>液态</option><option>慕斯</option>
            </select>
          </div>
        )}

        {category === 'outfit' && (
          <>
            <div className="form-group">
              <label>类型</label>
              <input value={form.type} onChange={e => update('type', e.target.value)} placeholder="例如：连衣裙、通勤套装" />
            </div>
            <div className="form-group">
              <label>配色</label>
              <input value={form.color} onChange={e => update('color', e.target.value)} placeholder="例如：白+灰" />
            </div>
            <div className="form-group">
              <label>适用季节</label>
              <div className="tags">
                {SEASON_OPTIONS.map(s => (
                  <span
                    key={s}
                    className={`tag ${form.season?.includes(s) ? 'pink' : ''}`}
                    onClick={() => toggleArray('season', s)}
                    style={{ cursor: 'pointer', padding: '6px 14px' }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

            <div className="form-group">
              <label>风格标签（可多选）</label>
              <div className="tags">
                {STYLE_OPTIONS.map(s => (
                  <span
                    key={s}
                    className={`tag ${form.style?.includes(s) ? 'purple' : ''}`}
                    onClick={() => toggleArray('style', s)}
                    style={{ cursor: 'pointer', padding: '6px 14px' }}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="hint">点击选择适合的风格，场景搭配将基于此推荐</div>
            </div>

            <div className="form-group">
              <label>备注</label>
              <textarea value={form.notes || ''} onChange={e => update('notes', e.target.value)} rows={2} placeholder="可选：购买渠道、使用感受等" />
            </div>
          </>
        )}

        {activeTab === 'inventory' && (
          <>
            <div className="form-group">
              <label>库存状态</label>
              <div className="tags">
                {STOCK_STATUS_OPTIONS.map(opt => (
                  <span
                    key={opt.value}
                    className={`tag ${form.stockStatus === opt.value ? 'pink' : ''}`}
                    onClick={() => update('stockStatus', opt.value)}
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    {opt.label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>购买日期</label>
                <input
                  type="date"
                  value={form.purchaseDate || ''}
                  onChange={e => update('purchaseDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>开封日期</label>
                <input
                  type="date"
                  value={form.openDate || ''}
                  onChange={e => update('openDate', e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>建议使用期限（天）</label>
                <input
                  type="number"
                  value={form.shelfLifeDays ?? ''}
                  onChange={e => update('shelfLifeDays', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="不填则使用默认值"
                />
                <div className="hint">美瞳按周期默认，化妆品默认365天</div>
              </div>
              <div className="form-group">
                <label>剩余数量/使用次数</label>
                <input
                  type="number"
                  value={form.remainingQuantity ?? ''}
                  onChange={e => update('remainingQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="例如：5"
                />
              </div>
            </div>

            <div className="form-group">
              <label>存放位置</label>
              <input
                value={form.storageLocation || ''}
                onChange={e => update('storageLocation', e.target.value)}
                placeholder="例如：化妆台第一层、旅行收纳包"
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.isEssential || false}
                  onChange={e => update('isEssential', e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span>是否常备（常用必需品）</span>
              </label>
            </div>
          </>
        )}

        <div className="btn-group" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={onCancel}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{initial ? '保存修改' : '确认添加'}</button>
        </div>
      </div>
    </div>
  );
}