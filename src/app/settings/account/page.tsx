'use client';

import { useState, useEffect } from 'react';
import { useDialog } from '@/contexts/DialogContext';

export default function AccountSettings() {
  const { showAlert } = useDialog();
  const [settings, setSettings] = useState({
    profileFirstName: '',
    profileLastName: '',
    profileEmail: '',
    profilePhone: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings({
          profileFirstName: data.profileFirstName || '',
          profileLastName: data.profileLastName || '',
          profileEmail: data.profileEmail || '',
          profilePhone: data.profilePhone || ''
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        await showAlert('Zapisano zmiany!');
      } else {
        await showAlert('Błąd zapisu');
      }
    } catch (e) {
      await showAlert('Błąd zapisu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Ładowanie...</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Moje konto</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2xl)' }}>
        Zarządzaj swoimi danymi osobowymi i ustawieniami logowania.
      </p>

      <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>Dane profilu</h3>
        
        <div style={{ display: 'flex', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
          <div>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '12px', fontSize: '0.8rem', padding: '6px 12px' }}>Zmień zdjęcie</button>
          </div>
          
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label>Imię</label>
              <input type="text" name="profileFirstName" className="form-input" value={settings.profileFirstName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Nazwisko</label>
              <input type="text" name="profileLastName" className="form-input" value={settings.profileLastName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Adres e-mail</label>
              <input type="email" name="profileEmail" className="form-input" value={settings.profileEmail} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Telefon</label>
              <input type="tel" name="profilePhone" className="form-input" value={settings.profilePhone} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>Zabezpieczenia</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <div className="form-group">
            <label>Aktualne hasło</label>
            <input type="password" className="form-input" placeholder="••••••••" />
          </div>
          <div />
          <div className="form-group">
            <label>Nowe hasło</label>
            <input type="password" className="form-input" />
          </div>
          <div className="form-group">
            <label>Powtórz nowe hasło</label>
            <input type="password" className="form-input" />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary">Zmień hasło</button>
        </div>
      </div>
    </div>
  );
}
