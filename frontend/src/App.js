import React, { useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, clearNotification } from './store';
import LogInteractionScreen, { Dashboard, Reports } from './components/LogInteractionScreen';
import './styles/global.css';

function Notification() {
  const dispatch = useDispatch();
  const n = useSelector(s => s.ui.notification);
  useEffect(() => {
    if (n) { const t = setTimeout(() => dispatch(clearNotification()), 5000); return () => clearTimeout(t); }
  }, [n, dispatch]);
  if (!n) return null;
  return (
    <div className={`notification ${n.type}`}>
      <div className="notif-row">
        <span className={`notif-icon ${n.type}`}>{n.type === 'success' ? '✓' : '✗'}</span>
        <span>{n.message}</span>
      </div>
      {n.summary && <div className="notif-summary">{n.summary}</div>}
    </div>
  );
}

function AppInner() {
  const [activePage, setActivePage] = useState('log');

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#00D4AA" strokeWidth="2"/>
              <path d="M8 14h4l2-5 2 10 2-5h2" stroke="#00D4AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="brand-name">AIVOA <span className="brand-sub">CRM</span></span>
          </div>
          <div className="header-module-badge">HCP Module</div>
        </div>
        <nav className="header-nav">
          <span className={`nav-item ${activePage === 'log' ? 'active' : ''}`} onClick={() => setActivePage('log')}>
            Log Interaction
          </span>
          <span className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}>
            Dashboard
          </span>
          <span className={`nav-item ${activePage === 'reports' ? 'active' : ''}`} onClick={() => setActivePage('reports')}>
            Reports
          </span>
        </nav>
        <div className="header-user">
          <div className="user-avatar">SR</div>
          <span className="user-name">Sales Rep</span>
        </div>
      </header>

      <main className="app-main">
        {activePage === 'log' && <LogInteractionScreen />}
        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'reports' && <Reports />}
      </main>

      <Notification />
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}><AppInner /></Provider>
  );
}