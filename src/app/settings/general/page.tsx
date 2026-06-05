'use client';

import { useState, useEffect } from 'react';
import { useDialog } from '@/contexts/DialogContext';

export default function GeneralSettings() {
  const { showAlert } = useDialog();
  const [settings, setSettings] = useState({
    companyName: '',
    nip: '',
    regon: '',
    street: '',
    postalCode: '',
    city: '',
    bankName: '',
    bankAccount: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings({
          companyName: data.companyName || '',
          nip: data.nip || '',
          regon: data.regon || '',
          street: data.street || '',
          postalCode: data.postalCode || '',
          city: data.city || '',
          bankName: data.bankName || '',
          bankAccount: data.bankAccount || ''
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
        await showAlert('Ustawienia zapisane!');
      } else {
        await showAlert('Błąd zapisu');
      }
    } catch (e) {
      await showAlert('Błąd zapisu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Ładowanie ustawień...</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Ustawienia ogólne</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2xl)' }}>
        Podstawowe dane Twojego warsztatu widoczne na dokumentach i fakturach.
      </p>

      <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>Dane firmy</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Pełna nazwa firmy</label>
            <input type="text" name="companyName" className="form-input" value={settings.companyName} onChange={handleChange} />
          </div>
          
          <div className="form-group">
            <label>NIP</label>
            <input type="text" name="nip" className="form-input" value={settings.nip} onChange={handleChange} />
            <button className="btn btn-secondary" style={{ marginTop: '8px', fontSize: '0.8rem', padding: '4px 8px' }}>Pobierz dane z GUS</button>
          </div>
          
          <div className="form-group">
            <label>REGON</label>
            <input type="text" name="regon" className="form-input" value={settings.regon} onChange={handleChange} />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Adres ulicy</label>
            <input type="text" name="street" className="form-input" value={settings.street} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Kod pocztowy</label>
            <input type="text" name="postalCode" className="form-input" value={settings.postalCode} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Miejscowość</label>
            <input type="text" name="city" className="form-input" value={settings.city} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>Konto bankowe (do przelewów)</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <div className="form-group">
            <label>Nazwa banku</label>
            <input type="text" name="bankName" className="form-input" value={settings.bankName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Numer konta (IBAN)</label>
            <input type="text" name="bankAccount" className="form-input" value={settings.bankAccount} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
          </button>
        </div>
      </div>
    </div>
  );
}
