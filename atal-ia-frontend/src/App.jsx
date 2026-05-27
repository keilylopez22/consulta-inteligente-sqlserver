import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';

const API_URL = 'http://localhost:8000';

const SUGGESTIONS = [
  '¿Cuántos registros hay en total?',
  'Muéstrame los primeros 10 registros',
  '¿Cuáles son las tablas disponibles?',
];

const WELCOME = {
  role: 'bot',
  text: '🤖💅 ¡Hola! Soy Atal-IA, tu asistente inteligente de Super Taller Donald. 💡💙 ¿Qué puedo hacer hoy por ti?',
  time: now(),
};

function now() {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchPage(sql, question, page, pageSize) {
    const res = await fetch(`${API_URL}/query?page=${page}&page_size=${pageSize}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    if (!res.ok) throw { friendly: data.detail || 'No pude procesar tu consulta.' };
    return data;
  }

  async function sendMessage(text) {
    const question = text || input.trim();
    if (!question || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question, time: now() }]);
    setLoading(true);

    try {
      const data = await fetchPage(null, question, 1, 50);
      const count = data.results?.length ?? 0;
      const summary = count === 0
        ? 'La consulta no devolvió resultados.'
        : `Encontré **${data.total}** registro${data.total !== 1 ? 's' : ''} en total. Mostrando página ${data.page} de ${data.total_pages}:`;

      setMessages(prev => [...prev, {
        role: 'bot',
        text: summary,
        sql: data.sql,
        results: data.results,
        pagination: data.total_pages > 1 ? {
          page: data.page,
          total_pages: data.total_pages,
          total: data.total,
          question,
        } : null,
        time: now(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'No pude obtener los resultados.',
        error: err.friendly || 'Ocurrió un error inesperado. Por favor intenta de nuevo.',
        time: now(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function goToPage(question, page) {
    setLoading(true);
    try {
      const data = await fetchPage(null, question, page, 50);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `Página ${data.page} de ${data.total_pages} · ${data.total} registros en total:`,
        sql: data.sql,
        results: data.results,
        pagination: data.total_pages > 1 ? {
          page: data.page,
          total_pages: data.total_pages,
          total: data.total,
          question,
        } : null,
        time: now(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'No pude cargar la página.',
        error: err.friendly || 'Ocurrió un error inesperado.',
        time: now(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <div style={{
      width: '100%', maxWidth: '860px', height: '100vh', maxHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '0', overflow: 'hidden',
      boxShadow: '0 0 60px rgba(108,99,255,0.15)',
    }}>

      {/* Header */}
      <div style={{
        padding: '16px 24px', background: 'var(--surface2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '14px',
        flexShrink: 0,
      }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', boxShadow: '0 0 16px rgba(108,99,255,0.4)',
        }}>🤖</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.02em' }}>Atal-IA</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            Conectado
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          <div>Gemini 2.5 Flash</div>
          <div>SQL Server</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} onPageChange={goToPage} />
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border)' }}>🤖</div>
            <div style={{ background: 'var(--bot-bubble)', border: '1px solid var(--border)', borderRadius: '4px 18px 18px 18px', padding: '12px 18px', display: 'flex', gap: '5px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: 'var(--accent2)', display: 'inline-block',
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div style={{ padding: '0 20px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => sendMessage(s)} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: '20px', padding: '6px 14px', color: 'var(--text-muted)',
              fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)'; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '14px 20px', borderTop: '1px solid var(--border)',
        background: 'var(--surface2)', display: 'flex', gap: '10px', flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe tu pregunta en lenguaje natural..."
          rows={1}
          disabled={loading}
          style={{
            flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '10px 14px', color: 'var(--text)',
            fontSize: '0.9rem', resize: 'none', outline: 'none',
            fontFamily: 'inherit', lineHeight: '1.5', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? 'var(--surface2)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
            border: 'none', borderRadius: '12px', padding: '0 20px',
            color: loading || !input.trim() ? 'var(--text-muted)' : 'white',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '1.2rem', transition: 'all 0.2s',
            boxShadow: loading || !input.trim() ? 'none' : '0 0 16px rgba(108,99,255,0.4)',
          }}
        >
          ➤
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
