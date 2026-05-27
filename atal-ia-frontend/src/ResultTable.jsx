export default function ResultTable({ data }) {
  if (!data || data.length === 0)
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>Sin resultados.</p>;

  const columns = Object.keys(data[0]);

  return (
    <div style={{ overflowX: 'auto', marginTop: '10px', borderRadius: '10px', border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ background: 'var(--surface2)' }}>
            {columns.map(col => (
              <th key={col} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--accent2)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
              {columns.map(col => (
                <td key={col} style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row[col] === null ? <span style={{ color: 'var(--text-muted)' }}>NULL</span> : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: '6px 12px', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: '0.75rem', borderTop: '1px solid var(--border)' }}>
        {data.length} fila{data.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
