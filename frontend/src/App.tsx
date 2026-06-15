import { Routes, Route, NavLink } from 'react-router-dom';
import ItemsPage from './pages/ItemsPage';
import SuggestPage from './pages/SuggestPage';
import SavedLooksPage from './pages/SavedLooksPage';
import ChecklistPage from './pages/ChecklistPage';
import StatsPage from './pages/StatsPage';

export default function App() {
  return (
    <div className="app">
      <div className="header">
        <h1>✨ 美瞳化妆搭配管家</h1>
        <p>智能场景搭配 · 出门清单提醒 · 用妆习惯分析</p>
        <nav className="nav">
          <NavLink to="/" end>📦 单品档案</NavLink>
          <NavLink to="/suggest">🎨 场景搭配</NavLink>
          <NavLink to="/saved">⭐ 方案收藏</NavLink>
          <NavLink to="/checklist">📋 出门清单</NavLink>
          <NavLink to="/stats">📊 统计分析</NavLink>
        </nav>
      </div>
      <div className="page">
        <Routes>
          <Route path="/" element={<ItemsPage />} />
          <Route path="/suggest" element={<SuggestPage />} />
          <Route path="/saved" element={<SavedLooksPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </div>
    </div>
  );
}