import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createInteraction } from '../store';

const INTERACTION_TYPES = ['Meeting', 'Call', 'Email', 'Conference', 'Virtual Meeting', 'Site Visit'];
const HCP_LIST = ['Dr. Smith', 'Dr. Patel', 'Dr. Sharma', 'Dr. Reddy', 'Dr. Rao'];

function TagInput({ placeholder, value, onChange }) {
  const [input, setInput] = useState('');
  const tags = value || [];

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) onChange([...tags, input.trim()]);
      setInput('');
    }
  };

  const removeTag = (t) => onChange(tags.filter(tag => tag !== t));

  return (
    <div className="tags-container">
      {tags.map(t => (
        <span key={t} className="tag">
          {t} <span className="tag-remove" onClick={() => removeTag(t)}>×</span>
        </span>
      ))}
      <input
        className="tags-input" value={input} placeholder={tags.length === 0 ? placeholder : ''}
        onChange={e => setInput(e.target.value)} onKeyDown={addTag}
      />
    </div>
  );
}

export default function FormPanel() {
  const dispatch = useDispatch();
  const loading = useSelector(s => s.interactions.loading);
  const notification = useSelector(s => s.ui.notification);

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);

  const [form, setForm] = useState({
    hcp_name: '', interaction_type: 'Meeting', date: today, time: now,
    attendees: '', topics_discussed: '', materials_shared: [],
    samples_distributed: [], sentiment: 'Neutral', outcomes: '', follow_up_actions: '',
  });

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target ? e.target.value : e }));

  const handleSubmit = async () => {
    if (!form.hcp_name || !form.topics_discussed) {
      alert('Please fill HCP Name and Topics Discussed.');
      return;
    }
    await dispatch(createInteraction(form));
    setForm(f => ({ ...f, topics_discussed: '', outcomes: '', follow_up_actions: '', materials_shared: [], samples_distributed: [], attendees: '' }));
  };

  const suggestions = notification?.summary ? [notification.summary] : [];

  return (
    <div className="form-panel">
      <div className="panel-header">
        <span className="panel-title">📋 Interaction Details</span>
        <span className="panel-badge">Structured Form</span>
      </div>

      <div className="form-body">
        <div className="form-row">
          <div className="field-group">
            <label className="field-label required">HCP Name</label>
            <select className="field-select" value={form.hcp_name} onChange={set('hcp_name')}>
              <option value="">Search or select HCP...</option>
              {HCP_LIST.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Interaction Type</label>
            <select className="field-select" value={form.interaction_type} onChange={set('interaction_type')}>
              {INTERACTION_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="field-group">
            <label className="field-label">Date</label>
            <input type="date" className="field-input" value={form.date} onChange={set('date')} />
          </div>
          <div className="field-group">
            <label className="field-label">Time</label>
            <input type="time" className="field-input" value={form.time} onChange={set('time')} />
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Attendees</label>
          <input className="field-input" placeholder="Enter names..." value={form.attendees} onChange={set('attendees')} />
        </div>

        <div className="field-group">
          <label className="field-label required">Topics Discussed</label>
          <textarea className="field-textarea" placeholder="Enter key discussion points..." value={form.topics_discussed} onChange={set('topics_discussed')} rows={3} />
        </div>

        <div className="field-group">
          <label className="field-label">Materials Shared</label>
          <TagInput placeholder="Type material and press Enter..." value={form.materials_shared} onChange={set('materials_shared')} />
        </div>

        <div className="field-group">
          <label className="field-label">Samples Distributed</label>
          <TagInput placeholder="Type sample name and press Enter..." value={form.samples_distributed} onChange={set('samples_distributed')} />
        </div>

        <div className="field-group">
          <label className="field-label">Observed HCP Sentiment</label>
          <div className="sentiment-group">
            {['Positive', 'Neutral', 'Negative'].map(s => (
              <div key={s} className={`sentiment-option ${s.toLowerCase()}`}>
                <input type="radio" name="sentiment" id={`s-${s}`} value={s} checked={form.sentiment === s} onChange={set('sentiment')} />
                <label htmlFor={`s-${s}`}>
                  {s === 'Positive' ? '😊' : s === 'Neutral' ? '😐' : '😟'} {s}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Outcomes</label>
          <textarea className="field-textarea" placeholder="Key outcomes or agreements..." value={form.outcomes} onChange={set('outcomes')} rows={2} />
        </div>

        <div className="field-group">
          <label className="field-label">Follow-up Actions</label>
          <textarea className="field-textarea" placeholder="Next steps or tasks..." value={form.follow_up_actions} onChange={set('follow_up_actions')} rows={2} />
        </div>

        {suggestions.length > 0 && (
          <div className="ai-suggestions">
            <div className="ai-suggestions-label">✨ AI Summary</div>
            {suggestions.map((s, i) => (
              <div key={i} className="ai-suggestion-item">{s}</div>
            ))}
          </div>
        )}
      </div>

      <div className="form-footer">
        <button className="btn btn-ghost" onClick={() => setForm(f => ({ ...f, topics_discussed: '', outcomes: '', follow_up_actions: '' }))}>
          Clear
        </button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ Logging...' : '✅ Log Interaction'}
        </button>
      </div>
    </div>
  );
}