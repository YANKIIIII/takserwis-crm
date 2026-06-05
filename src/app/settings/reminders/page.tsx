'use client';

import { useState, useEffect } from 'react';

export default function RemindersSettings() {
  const [settings, setSettings] = useState({
    reminderTechInspectionEnabled: 'true',
    reminderOcInsuranceEnabled: 'false',
    reminderAcServiceEnabled: 'true'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings({
          reminderTechInspectionEnabled: data.reminderTechInspectionEnabled || 'true',
          reminderOcInsuranceEnabled: data.reminderOcInsuranceEnabled || 'false',
          reminderAcServiceEnabled: data.reminderAcServiceEnabled || 'true'
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleSetting = async (name: string) => {
    const newValue = settings[name as keyof typeof settings] === 'true' ? 'false' : 'true';
    const newSettings = { ...settings, [name]: newValue };
    setSettings(newSettings);

    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [name]: newValue })
    });
  };

  if (loading) return <div>Ładowanie...</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Planowane przypomnienia</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2xl)' }}>
        Skonfiguruj automatyczne powiadomienia wysyłane do klientów na podstawie określonych zdarzeń. Kliknij status, aby przełączyć.
      </p>

      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Aktywne reguły</h3>
          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>+ Nowa reguła</button>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--bg-body)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Zdarzenie</th>
                <th style={{ padding: '12px 16px' }}>Czas wysyłki</th>
                <th style={{ padding: '12px 16px' }}>Kanał</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>Przegląd techniczny</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>14 dni przed upływem terminu</td>
                <td style={{ padding: '12px 16px' }}>SMS</td>
                <td style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => toggleSetting('reminderTechInspectionEnabled')}>
                  {settings.reminderTechInspectionEnabled === 'true' ? (
                    <span style={{ color: 'green', fontWeight: 500 }}>Włączone</span>
                  ) : (
                    <span style={{ color: 'red', fontWeight: 500 }}>Wyłączone</span>
                  )}
                </td>
              </tr>
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>Koniec ubezpieczenia OC</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>30 dni przed upływem terminu</td>
                <td style={{ padding: '12px 16px' }}>E-mail</td>
                <td style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => toggleSetting('reminderOcInsuranceEnabled')}>
                  {settings.reminderOcInsuranceEnabled === 'true' ? (
                    <span style={{ color: 'green', fontWeight: 500 }}>Włączone</span>
                  ) : (
                    <span style={{ color: 'red', fontWeight: 500 }}>Wyłączone</span>
                  )}
                </td>
              </tr>
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>Coroczny serwis klimatyzacji</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>12 miesięcy po ostatnim serwisie</td>
                <td style={{ padding: '12px 16px' }}>SMS</td>
                <td style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => toggleSetting('reminderAcServiceEnabled')}>
                  {settings.reminderAcServiceEnabled === 'true' ? (
                    <span style={{ color: 'green', fontWeight: 500 }}>Włączone</span>
                  ) : (
                    <span style={{ color: 'red', fontWeight: 500 }}>Wyłączone</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
