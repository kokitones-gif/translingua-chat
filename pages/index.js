import React, { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export default function TranslatingChat() {
  const [user1Lang, setUser1Lang] = useState('ja');
  const [user2Lang, setUser2Lang] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(null);
  const [currentView, setCurrentView] = useState('user1');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showOriginal, setShowOriginal] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('translingua-chat');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.messages) setMessages(data.messages);
      if (data.user1Lang) setUser1Lang(data.user1Lang);
      if (data.user2Lang) setUser2Lang(data.user2Lang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('translingua-chat', JSON.stringify({ messages, user1Lang, user2Lang }));
  }, [messages, user1Lang, user2Lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearHistory = () => {
    if (confirm('チャット履歴を削除しますか？')) {
      setMessages([]);
      localStorage.removeItem('translingua-chat');
    }
  };

  const translateMessage = async (text, targetLang) => {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang })
      });
      const data = await res.json();
      return data.translated || text;
    } catch (e) {
      return text;
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const msgId = Date.now();
    const senderLang = currentView === 'user1' ? user1Lang : user2Lang;

    const newMsg = {
      id: msgId,
      sender: currentView,
      original: inputText,
      translatedForUser1: null,
      translatedForUser2: null,
      isTranslating: true
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    const [t1, t2] = await Promise.all([
      senderLang === user1Lang ? inputText : translateMessage(inputText, user1Lang),
      senderLang === user2Lang ? inputText : translateMessage(inputText, user2Lang)
    ]);

    setMessages(prev => prev.map(msg =>
      msg.id === msgId ? { ...msg, translatedForUser1: t1, translatedForUser2: t2, isTranslating: false } : msg
    ));
  };

  const getDisplayText = (msg) => {
    if (msg.isTranslating) return '翻訳中...';
    return currentView === 'user1' ? msg.translatedForUser1 : msg.translatedForUser2;
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', margin: 0, padding: 0, background: currentView === 'user1' ? 'linear-gradient(135deg, #0f0f1a, #1a1a2e, #16213e)' : 'linear-gradient(135deg, #1a0f1a, #2e1a2e, #3e1621)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={user1Lang} onChange={e => setUser1Lang(e.target.value)} style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }}>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </select>
          <button onClick={clearHistory} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setCurrentView('user1')} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: currentView === 'user1' ? '#6366f1' : 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 'bold' }}>koki</button>
          <button onClick={() => setCurrentView('user2')} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: currentView === 'user2' ? '#ec4899' : 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 'bold' }}>rita</button>
        </div>
        <select value={user2Lang} onChange={e => setUser2Lang(e.target.value)} style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }}>
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
        </select>
      </header>
      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(msg => (
          <div key={msg.id} onClick={() => setShowOriginal(p => ({...p, [msg.id]: !p[msg.id]}))} style={{ alignSelf: msg.sender === currentView ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '12px 16px', borderRadius: 16, background: msg.sender === currentView ? (currentView === 'user1' ? '#6366f1' : '#ec4899') : 'rgba(255,255,255,0.1)', color: '#fff' }}>
            <div>{getDisplayText(msg)}</div>
            {showOriginal[msg.id] && msg.sender !== currentView && <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>原文: {msg.original}</div>}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 25, padding: 8 }}>
          <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="メッセージを入力..." style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', padding: '8px 16px', fontSize: 16, outline: 'none' }} />
          <button onClick={handleSendMessage} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: currentView === 'user1' ? '#6366f1' : '#ec4899', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>➤</button>
        </div>
      </div>
    </div>
  );
}
