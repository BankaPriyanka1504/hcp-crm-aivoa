import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab, fetchInteractions } from '../store';
import FormPanel from './FormPanel';
import ChatPanel from './ChatPanel';
import HistorySection from './HistorySection';

function Dashboard() {
  const interactions = useSelector(s => s.interactions.list);
  const total = interactions.length;
  const positive = interactions.filter(i => i.sentiment === 'Positive').length;
  const negative = interactions.filter(i => i.sentiment === 'Negative').length;
  const neutral = interactions.filter(i => i.sentiment === 'Neutral').length;
  const types = interactions.reduce((acc, i) => {
    acc[i.interaction_type] = (acc[i.interaction_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: '0' }}>
      <div className="screen-header">
        <h1 className="screen-title">📊 <span>Dashboard</span></h1>
        <p className="screen-subtitle">Overview of your HCP engagement activity</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Interactions', value: total, color: '#00D4AA', icon: '📋' },
          { label: 'Positive Sentiment', value: positive, color: '#10B981', icon: '😊' },
          { label: 'Neutral Sentiment', value: neutral, color: '#F59E0B', icon: '😐' },
          { label: 'Negative Sentiment', value: negative, color: '#EF4444', icon: '😟' },
        ].map((card, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '20px',
            borderLeft: `3px solid ${card.color}`
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{card.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: card.color }}>{card.value}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Interaction Types */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Interaction Types Breakdown</div>
          {Object.keys(types).length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No interactions logged yet.</div>
          ) : (
            Object.entries(types).map(([type, count]) => (
              <div key={type} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>{type}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{count}</span>
                </div>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '4px', height: '6px' }}>
                  <div style={{
                    background: 'var(--accent)', borderRadius: '4px', height: '6px',
                    width: `${(count / total) * 100}%`, transition: 'width 0.5s'
                  }} />
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Sentiment Distribution</div>
          {total === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No interactions logged yet.</div>
          ) : (
            [
              { label: 'Positive', value: positive, color: '#10B981' },
              { label: 'Neutral', value: neutral, color: '#F59E0B' },
              { label: 'Negative', value: negative, color: '#EF4444' },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: item.color }}>{item.label}</span>
                  <span style={{ fontWeight: '600' }}>{total > 0 ? Math.round((item.value / total) * 100) : 0}%</span>
                </div>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '4px', height: '6px' }}>
                  <div style={{
                    background: item.color, borderRadius: '4px', height: '6px',
                    width: `${total > 0 ? (item.value / total) * 100 : 0}%`, transition: 'width 0.5s'
                  }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {interactions.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginTop: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Recent Activity</div>
          {interactions.slice(0, 5).map(i => (
            <div key={i.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 0', borderBottom: '1px solid var(--border)'
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                background: i.sentiment === 'Positive' ? '#10B981' : i.sentiment === 'Negative' ? '#EF4444' : '#F59E0B'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{i.hcp_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{i.interaction_type} · {i.date}</div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{i.sentiment}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Reports() {
  const interactions = useSelector(s => s.interactions.list);

  const hcpStats = interactions.reduce((acc, i) => {
    if (!acc[i.hcp_name]) acc[i.hcp_name] = { name: i.hcp_name, total: 0, positive: 0, types: {} };
    acc[i.hcp_name].total++;
    if (i.sentiment === 'Positive') acc[i.hcp_name].positive++;
    acc[i.hcp_name].types[i.interaction_type] = (acc[i.hcp_name].types[i.interaction_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="screen-header">
        <h1 className="screen-title">📈 <span>Reports</span></h1>
        <p className="screen-subtitle">Detailed analytics on your HCP engagement</p>
      </div>

      {/* Summary Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: '14px', fontWeight: '600' }}>
          HCP Engagement Summary
        </div>
        {Object.keys(hcpStats).length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No interactions logged yet. Start logging to see reports.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                {['HCP Name', 'Total Interactions', 'Positive', 'Success Rate', 'Top Activity'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.values(hcpStats).map((hcp, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600' }}>{hcp.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--accent)' }}>{hcp.total}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#10B981' }}>{hcp.positive}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                    <span style={{ color: hcp.total > 0 && (hcp.positive / hcp.total) > 0.5 ? '#10B981' : '#F59E0B' }}>
                      {hcp.total > 0 ? Math.round((hcp.positive / hcp.total) * 100) : 0}%
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {Object.entries(hcp.types).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* All Interactions Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: '14px', fontWeight: '600' }}>
          All Interactions Log
        </div>
        {interactions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No interactions found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                {['ID', 'HCP Name', 'Type', 'Date', 'Sentiment', 'AI Summary'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {interactions.map((i, idx) => (
                <tr key={i.id} style={{ borderTop: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>#{i.id}</td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '600' }}>{i.hcp_name}</td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{i.interaction_type}</td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{i.date}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px',
                      background: i.sentiment === 'Positive' ? 'rgba(16,185,129,0.1)' : i.sentiment === 'Negative' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      color: i.sentiment === 'Positive' ? '#10B981' : i.sentiment === 'Negative' ? '#EF4444' : '#F59E0B',
                    }}>{i.sentiment}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {i.ai_summary || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function LogInteractionScreen() {
  const dispatch = useDispatch();
  const activeTab = useSelector(s => s.ui.activeTab);

  useEffect(() => { dispatch(fetchInteractions()); }, [dispatch]);

  return (
    <div className="log-screen">
      <div className="screen-header">
        <h1 className="screen-title">Log <span>HCP Interaction</span></h1>
        <p className="screen-subtitle">Record your healthcare professional touchpoints with AI assistance</p>
      </div>

      <div className="screen-tabs">
        <button className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`} onClick={() => dispatch(setActiveTab('form'))}>
          📋 Structured Form
        </button>
        <button className={`tab-btn chat ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => dispatch(setActiveTab('chat'))}>
          🤖 AI Chat
        </button>
      </div>

      <div className="content-grid">
        {activeTab === 'form' ? (
          <>
            <FormPanel />
            <ChatPanel sidebarMode={true} />
          </>
        ) : (
          <ChatPanel sidebarMode={false} />
        )}
      </div>

      <HistorySection />
    </div>
  );
}

export { Dashboard, Reports };