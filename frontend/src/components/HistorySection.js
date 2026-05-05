import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { editInteraction } from '../store';

function EditModal({ interaction, onClose }) {
  const dispatch = useDispatch();
  const [field, setField] = useState('outcomes');
  const [value, setValue] = useState(interaction[field] || '');

  const fields = ['topics_discussed', 'outcomes', 'follow_up_actions', 'sentiment', 'attendees'];

  const handleSave = async () => {
    await dispatch(editInteraction(interaction.id, { [field]: value }));
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">✏️ Edit Interaction #{interaction.id}</div>
        <div className="field-group" style={{ marginBottom: '12px' }}>
          <label className="field-label">Field to Edit</label>
          <select className="field-select" value={field} onChange={e => { setField(e.target.value); setValue(interaction[e.target.value] || ''); }}>
            {fields.map(f => <option key={f} value={f}>{f.replace(/_/g, ' ').toUpperCase()}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label">New Value</label>
          <textarea className="field-textarea" value={value} onChange={e => setValue(e.target.value)} rows={4} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default function HistorySection() {
  const interactions = useSelector(s => s.interactions.list);
  const [editing, setEditing] = useState(null);

  if (interactions.length === 0) return null;

  return (
    <div className="history-section">
      <div className="history-section-title">
        Recent Interactions
        <span className="history-count">{interactions.length}</span>
      </div>
      <div className="history-list">
        {interactions.map(i => (
          <div key={i.id} className="history-item">
            <div className={`history-dot ${i.sentiment}`} />
            <div className="history-content">
              <div className="history-hcp">{i.hcp_name}</div>
              <div className="history-meta">{i.interaction_type} · {i.date} {i.time} · Sentiment: {i.sentiment}</div>
              {i.ai_summary && <div className="history-summary">🤖 {i.ai_summary}</div>}
              <div className="history-actions">
                <button className="history-btn" onClick={() => setEditing(i)}>✏️ Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing && <EditModal interaction={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}