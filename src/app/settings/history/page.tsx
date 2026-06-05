'use client';

export default function HistorySettings() {
  return (
    <div style={{ maxWidth: '900px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Historia zmian (Logi systemowe)</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2xl)' }}>
        Śledź kto i kiedy wprowadził zmiany w aplikacji.
      </p>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr style={{ background: 'var(--bg-body)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px 16px' }}>Data i czas</th>
              <th style={{ padding: '12px 16px' }}>Użytkownik</th>
              <th style={{ padding: '12px 16px' }}>Akcja</th>
              <th style={{ padding: '12px 16px' }}>Szczegóły</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Dzisiaj, 14:32</td>
              <td style={{ padding: '12px 16px', fontWeight: 500 }}>Jan Kowalski</td>
              <td style={{ padding: '12px 16px' }}><span style={{ color: 'var(--orange-high)', background: 'var(--orange-bg)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Edycja</span></td>
              <td style={{ padding: '12px 16px' }}>Edytowano zlecenie ZL/2026/05/12</td>
            </tr>
            <tr style={{ borderTop: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Dzisiaj, 11:15</td>
              <td style={{ padding: '12px 16px', fontWeight: 500 }}>Michał Nowak (Mechanik)</td>
              <td style={{ padding: '12px 16px' }}><span style={{ color: 'green', background: 'rgba(0, 128, 0, 0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Dodanie</span></td>
              <td style={{ padding: '12px 16px' }}>Dodano komentarz do pojazdu WX 12345</td>
            </tr>
            <tr style={{ borderTop: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Wczoraj, 16:45</td>
              <td style={{ padding: '12px 16px', fontWeight: 500 }}>Jan Kowalski</td>
              <td style={{ padding: '12px 16px' }}><span style={{ color: 'red', background: 'rgba(255, 0, 0, 0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Usunięcie</span></td>
              <td style={{ padding: '12px 16px' }}>Usunięto fakturę FV/2026/05/01</td>
            </tr>
            <tr style={{ borderTop: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Wczoraj, 09:00</td>
              <td style={{ padding: '12px 16px', fontWeight: 500 }}>System</td>
              <td style={{ padding: '12px 16px' }}><span style={{ color: 'blue', background: 'rgba(0, 0, 255, 0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Automatyzacja</span></td>
              <td style={{ padding: '12px 16px' }}>Wysłano powiadomienia SMS (3 szt.)</td>
            </tr>
          </tbody>
        </table>
        
        <div style={{ padding: 'var(--space-md)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Załaduj więcej historii</button>
        </div>
      </div>
    </div>
  );
}
