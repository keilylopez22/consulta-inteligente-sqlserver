import ResultTable from './ResultTable';

const BOT_AVATAR = '🤖';
const USER_AVATAR = '👤';

function Pagination({ pagination, onPageChange }) {
  const { page, total_pages, question } = pagination;
  const btnStyle = (disabled) => ({
    background: disabled ? 'var(--surface)' : 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '8px', padding: '4px 12px',
    color: disabled ? 'var(--text-muted)' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.8rem', transition: 'all 0.2s',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
      <button style={btnStyle(page <= 1)} disabled={page <= 1} onClick={() => onPageChange(question, 1)}>« Primera</button>
      <button style={btnStyle(page <= 1)} disabled={page <= 1} onClick={() => onPageChange(question, page - 1)}>‹ Anterior</button>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0 4px' }}>
        Página <strong style={{ color: 'var(--text)' }}>{page}</strong> de <strong style={{ color: 'var(--text)' }}>{total_pages}</strong>
      </span>
      <button style={btnStyle(page >= total_pages)} disabled={page >= total_pages} onClick={() => onPageChange(question, page + 1)}>Siguiente ›</button>
      <button style={btnStyle(page >= total_pages)} disabled={page >= total_pages} onClick={() => onPageChange(question, total_pages)}>Última »</button>
    </div>
  );
}

export default function ChatMessage({ message, onPageChange }) {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-start', gap: '10px', marginBottom: '18px',
      animation: 'fadeIn 0.25s ease',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'var(--user-bubble)' : 'var(--surface2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', border: '2px solid var(--border)',
      }}>
        {isUser ? USER_AVATAR : BOT_AVATAR}
      </div>

      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          background: isUser ? 'var(--user-bubble)' : 'var(--bot-bubble)',
          padding: '12px 16px',
          borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
          color: 'var(--text)', fontSize: '0.9rem', lineHeight: '1.55',
          border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          {message.text}
        </div>

        {message.sql && (
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span>🗄️</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SQL generado</span>
            </div>
            <code style={{ fontSize: '0.78rem', color: 'var(--accent2)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {message.sql}
            </code>
          </div>
        )}

        {message.results && <ResultTable data={message.results} />}

        {message.pagination && (
          <Pagination pagination={message.pagination} onPageChange={onPageChange} />
        )}

        {message.error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)', borderRadius: '10px', padding: '10px 14px', color: 'var(--error)', fontSize: '0.85rem', lineHeight: '1.5' }}>
            ⚠️ {message.error}
          </div>
        )}

        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: isUser ? 'flex-end' : 'flex-start' }}>
          {message.time}
        </span>
      </div>
    </div>
  );
}
