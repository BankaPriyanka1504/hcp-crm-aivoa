import { configureStore, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000/api' });

const interactionsSlice = createSlice({
  name: 'interactions',
  initialState: { list: [], loading: false, error: null },
  reducers: {
    setLoading: (s) => { s.loading = true; },
    setInteractions: (s, a) => { s.list = a.payload; s.loading = false; },
    addInteraction: (s, a) => { s.list.unshift(a.payload); s.loading = false; },
    updateInteraction: (s, a) => {
      const idx = s.list.findIndex(i => i.id === a.payload.id);
      if (idx >= 0) s.list[idx] = a.payload;
      s.loading = false;
    },
    setError: (s, a) => { s.error = a.payload; s.loading = false; },
  },
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: { messages: [], loading: false, sessionId: `session_${Date.now()}` },
  reducers: {
    addMessage: (s, a) => { s.messages.push(a.payload); },
    setChatLoading: (s, a) => { s.loading = a.payload; },
    clearChat: (s) => { s.messages = []; s.sessionId = `session_${Date.now()}`; },
  },
});

const uiSlice = createSlice({
  name: 'ui',
  initialState: { activeTab: 'form', notification: null },
  reducers: {
    setActiveTab: (s, a) => { s.activeTab = a.payload; },
    showNotification: (s, a) => { s.notification = a.payload; },
    clearNotification: (s) => { s.notification = null; },
  },
});

export const { setLoading, setInteractions, addInteraction, updateInteraction, setError } = interactionsSlice.actions;
export const { addMessage, setChatLoading, clearChat } = chatSlice.actions;
export const { setActiveTab, showNotification, clearNotification } = uiSlice.actions;

export const fetchInteractions = () => async (dispatch) => {
  dispatch(setLoading());
  try {
    const { data } = await API.get('/interactions/');
    dispatch(setInteractions(data));
  } catch (e) { dispatch(setError(e.message)); }
};

export const createInteraction = (formData) => async (dispatch) => {
  dispatch(setLoading());
  try {
    const { data } = await API.post('/interactions/', formData);
    dispatch(addInteraction(data));
    dispatch(showNotification({ type: 'success', message: 'Interaction logged!', summary: data.ai_summary }));
    return data;
  } catch (e) {
    dispatch(setError(e.message));
    dispatch(showNotification({ type: 'error', message: 'Failed to log interaction.' }));
  }
};

export const editInteraction = (id, updates) => async (dispatch) => {
  try {
    const { data } = await API.patch(`/interactions/${id}`, updates);
    dispatch(updateInteraction(data));
    dispatch(showNotification({ type: 'success', message: 'Interaction updated!' }));
    return data;
  } catch (e) { dispatch(setError(e.message)); }
};

export const sendChatMessage = (message, sessionId) => async (dispatch) => {
  dispatch(addMessage({ role: 'user', content: message, timestamp: new Date().toISOString() }));
  dispatch(setChatLoading(true));
  try {
    const { data } = await API.post('/agent/chat', { message, session_id: sessionId });
    dispatch(addMessage({ role: 'assistant', content: data.response, action: data.action_taken, timestamp: new Date().toISOString() }));
    if (data.action_taken === 'log_interaction') dispatch(fetchInteractions());
  } catch (e) {
    dispatch(addMessage({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date().toISOString() }));
  }
  dispatch(setChatLoading(false));
};

export const store = configureStore({
  reducer: {
    interactions: interactionsSlice.reducer,
    chat: chatSlice.reducer,
    ui: uiSlice.reducer,
  },
});