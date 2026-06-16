import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { travelPlansApi, itemsApi, AllItems } from '../api';
import type { TravelPlan, SceneType, DailyScene } from '../types';
import { SceneLabels } from '../types';

const BaggageOptions = [
  { value: '20', label: '轻便(20寸登机箱)' },
  { value: '24', label: '标准(24寸托运)' },
  { value: '28', label: '大型(28寸以上)' },
];

export default function TravelCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const isEdit = !!editId;

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [baggageSize, setBaggageSize] = useState('24');
  const [minTemp, setMinTemp] = useState<number | ''>('');
  const [maxTemp, setMaxTemp] = useState<number | ''>('');
  const [weatherDesc, setWeatherDesc] = useState('');
  const [dailyScenes, setDailyScenes] = useState<DailyScene[]>([]);
  const [items, setItems] = useState<AllItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 0;

  const loadData = async () => {
    setLoading(true);
    try {
      const itemsData = await itemsApi.getAll();
      setItems(itemsData);

      if (isEdit && editId) {
        const plan = await travelPlansApi.get(editId);
        setName(plan.name);
        setDestination(plan.destination);
        setStartDate(plan.startDate);
        setEndDate(plan.endDate);
        setMinTemp(plan.weather?.[0]?.minTemp ?? '');
        setMaxTemp(plan.weather?.[0]?.maxTemp ?? '');
        setWeatherDesc(plan.weather?.[0]?.description ?? '');
        setDailyScenes(plan.dailyScenes || []);
      }
    } catch (e) {
      alert('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [editId]);

  useEffect(() => {
    if (days === 0) return;
    setDailyScenes(prev => {
      const next: DailyScene[] = [];
      for (let i = 0; i < days; i++) {
        const existing = prev.find(ds => ds.dayIndex === i);
        next.push({
          dayIndex: i,
          scene: existing?.scene || 'travel',
          notes: existing?.notes || '',
          date: existing?.date,
        });
      }
      return next;
    });
  }, [days]);

  const updateScene = (dayIndex: number, scene: SceneType) => {
    setDailyScenes(prev => prev.map(ds =>
      ds.dayIndex === dayIndex ? { ...ds, scene } : ds
    ));
  };

  const updateNotes = (dayIndex: number, notes: string) => {
    setDailyScenes(prev => prev.map(ds =>
      ds.dayIndex === dayIndex ? { ...ds, notes } : ds
    ));
  };

  const validate = (): boolean => {
    if (!name.trim()) {
      alert('请输入旅行名称');
      return false;
    }
    if (!destination.trim()) {
      alert('请输入目的地');
      return false;
    }
    if (!startDate) {
      alert('请选择开始日期');
      return false;
    }
    if (!endDate) {
      alert('请选择结束日期');
      return false;
    }
    if (new Date(endDate) < new Date(startDate)) {
      alert('结束日期不能早于开始日期');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const weather = (minTemp !== '' || maxTemp !== '' || weatherDesc) ? [{
        minTemp: minTemp === '' ? 0 : Number(minTemp),
        maxTemp: maxTemp === '' ? 0 : Number(maxTemp),
        description: weatherDesc,
      }] : undefined;

      if (isEdit && editId) {
        await travelPlansApi.update(editId, {
          name,
          destination,
          startDate,
          endDate,
          days,
          weather,
          dailyScenes,
          baggageLimit: { volume: Number(baggageSize) },
        });
        navigate(`/travel/${editId}`);
      } else {
        const plan = await travelPlansApi.create({
          name,
          destination,
          startDate,
          endDate,
          days,
          weather,
          dailyScenes,
          baggageLimit: { volume: Number(baggageSize) },
          lockedItemIds: [],
          mergedItemIds: [],
        });
        navigate(`/travel/${plan.id}`);
      }
    } catch (e) {
      alert(isEdit ? '保存失败' : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="empty"><div className="emoji">⏳</div><p>加载中...</p></div>;
  }

  return (
    <div>
      <h1 className="page-title">{isEdit ? '✏️ 编辑旅行计划' : '✨ 新建旅行计划'}</h1>

      <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="form-group">
          <label>旅行名称 <span style={{ color: '#ef4444' }}>*</span></label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="如：东京樱花季7日游" />
        </div>

        <div className="form-group">
          <label>目的地 <span style={{ color: '#ef4444' }}>*</span></label>
          <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="如：日本东京" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label>开始日期 <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>结束日期 <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>天数（自动计算）</label>
          <div style={{
            padding: '10px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            background: '#f9fafb',
            color: '#4b5563',
            fontSize: 14,
          }}>
            🗓️ 共 {days} 天
          </div>
        </div>

        <div className="form-group">
          <label>行李容量限制</label>
          <select value={baggageSize} onChange={e => setBaggageSize(e.target.value)}>
            {BaggageOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label>最低温度 (°C)</label>
            <input
              type="number"
              value={minTemp}
              onChange={e => setMinTemp(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="如：15"
            />
          </div>
          <div className="form-group">
            <label>最高温度 (°C)</label>
            <input
              type="number"
              value={maxTemp}
              onChange={e => setMaxTemp(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="如：25"
            />
          </div>
        </div>

        <div className="form-group">
          <label>天气描述</label>
          <input value={weatherDesc} onChange={e => setWeatherDesc(e.target.value)} placeholder="如：晴转多云" />
        </div>

        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 12, fontSize: 16, color: '#111827' }}>🗓️ 每日场景配置</h3>
          {days === 0 ? (
            <div style={{ fontSize: 13, color: '#9ca3af', padding: 12, background: '#f9fafb', borderRadius: 8 }}>
              请先选择开始和结束日期
            </div>
          ) : (
            dailyScenes.map(ds => (
              <div key={ds.dayIndex} style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 1fr',
                gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid #f3f4f6',
                alignItems: 'center',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#4b5563' }}>
                  第{ds.dayIndex + 1}天
                </div>
                <select
                  value={ds.scene}
                  onChange={e => updateScene(ds.dayIndex, e.target.value as SceneType)}
                >
                  {(['commute', 'date', 'photo', 'travel'] as SceneType[]).map(s => (
                    <option key={s} value={s}>{SceneLabels[s]}</option>
                  ))}
                </select>
                <input
                  value={ds.notes || ''}
                  onChange={e => updateNotes(ds.dayIndex, e.target.value)}
                  placeholder="备注（如：迪士尼乐园拍照）"
                />
              </div>
            ))
          )}
        </div>

        <div className="btn-group" style={{ justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/travel')}>取消</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '处理中...' : (isEdit ? '💾 保存修改' : '🚀 创建并生成搭配')}
          </button>
        </div>
      </div>
    </div>
  );
}
