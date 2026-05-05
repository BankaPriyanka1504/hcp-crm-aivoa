import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendChatMessage, clearChat } from '../store';

const QUICK_ACTIONS = [
  'Log a meeting with Dr. Smith',
  'Get history for Dr. Patel',
  'Analyze sentiment of last interaction',
  'Suggest follow-up for Dr. Sharma',
];

export default function ChatPanel({ sidebarMode }) {
  const dispatch = useDispatch();
  const { messages, loading, sessionId } = useSelector(s => s.chat);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = () => {
    if (!input.trim() || loading) return;
    dispatch(sendChatMessage(input.trim(), sessionId));
    setInput('');
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  if (sidebarMode) {
    return (
      <div className="chat-panel">
        <div className="panel-header">
          <span className="panel-title">🤖 AI Assistant</span>
          <span className="panel-badge">LangGraph</span>
        </div>

        {messages.length === 0 && (
          <div style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '12px' }}>Log interaction details here, e.g.:</p>
            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '12px' }}>
              "Met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochure"
            </p>
          </div>
        )}

        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role === 'user' ? 'user' : 'ai'}`}>
              <div className={`msg-avatar ${msg.role === 'user' ? 'user' : 'ai'}`}>
                {msg.role === 'user' ? 'SR' : 'AI'}
              </div>
              <div className="msg-bubble">
                {msg.content}
                {msg.action && <div className="msg-action">⚡ {msg.action}</div>}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-message ai">
              <div className="msg-avatar ai">AI</div>
              <div className="msg-bubble">
                <div className="typing-indicator">
                  <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-quick-actions">
          {QUICK_ACTIONS.map((q, i) => (
            <button key={i} className="quick-action" onClick={() => { setInput(q); }}>
              {q}
            </button>
          ))}
        </div>

        <div className="chat-input-area">
          <textarea
            className="chat-input" rows={1} placeholder="Describe interaction..."
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          />
          <button className="chat-send-btn" onClick={send} disabled={loading || !input.trim()}>
            ➤
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-panel" style={{ gridColumn: '1 / -1' }}>
      <div className="panel-header">
        <span className="panel-title">🤖 AI Chat — Log via Conversation</span>
        <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => dispatch(clearChat())}>
          Clear Chat
        </button>
      </div>
      <div className="chat-messages" style={{ height: '500px' }}>
        {messages.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
            <p>Describe your HCP interaction in natural language.<br />I'll extract the details and log it for you!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role === 'user' ? 'user' : 'ai'}`}>
            <div className={`msg-avatar ${msg.role === 'user' ? 'user' : 'ai'}`}>
              {msg.role === 'user' ? 'SR' : 'AI'}
            </div>
            <div className="msg-bubble">
              {msg.content}
              {msg.action && <div className="msg-action">⚡ {msg.action}</div>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-message ai">
            <div className="msg-avatar ai">AI</div>
            <div className="msg-bubble">
              <div className="typing-indicator">
                <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="chat-quick-actions">
        {QUICK_ACTIONS.map((q, i) => (
          <button key={i} className="quick-action" onClick={() => dispatch(sendChatMessage(q, sessionId))}>
            {q}
          </button>
        ))}
      </div>
      <div className="chat-input-area">
        <textarea
          className="chat-input" rows={2} placeholder="e.g. Met Dr. Patel today, discussed oncology drug, positive response..."
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
        />
        <button className="chat-send-btn" onClick={send} disabled={loading || !input.trim()}>➤</button>
      </div>
    </div>
  );
}