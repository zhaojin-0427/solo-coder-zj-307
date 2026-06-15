import { useState, useEffect } from 'react';
import type { ItemCategory, LensType } from '../types';

interface Props {
  category: ItemCategory;
  initial: any;
  onSave: (category: ItemCategory, payload: any) => void;
  onCancel: () => void;
}

const STYLE_OPTIONS = ['自然', '通勤', '职业', '甜美', '约会', '温柔', '精致', '混血', '复古', '酷', '拍照', '旅行', '清新', '活力', '低调'];
const SEASON_OPTIONS = ['春', '夏', '秋', '冬'];

export default function ItemForm({ category, initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<any>({
    name: '', brand: '', style: [], notes: '',
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
    onSave(category, form);
  };

  const title = (category === 'lens' ? '美瞳' : category === 'lipstick' ? '口红' : category === 'blush' ? '腮红' : '服饰');

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{initial ? '编辑' : '新增'}{title}</h2>

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

        <div className="btn-group" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={onCancel}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{initial ? '保存修改' : '确认添加'}</button>
        </div>
      </div>
    </div>
  );
}