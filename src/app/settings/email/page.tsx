'use client';

import { useState, useEffect } from 'react';
import { CustomSelect } from '@/components/CustomSelect';
import { useDialog } from '@/contexts/DialogContext';

export default function EmailSettings() {
  const { showAlert } = useDialog();
  const [settings, setSettings] = useState({
    smtpServer: '',
    smtpPort: '',
    smtpEncryption: 'SSL/TLS',
    smtpUser: '',
    smtpPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings({
          smtpServer: data.smtpServer || '',
          smtpPort: data.smtpPort || '',
          smtpEncryption: data.smtpEncryption || 'SSL/TLS',
          smtpUser: data.smtpUser || '',
          smtpPassword: data.smtpPassword || ''
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        await showAlert('Konfiguracja e-mail zapisana!');
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
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>E-mail i serwer SMTP</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2xl)' }}>
        Skonfiguruj skrzynkę pocztową do wysyłania faktur i powiadomień.
      </p>

      <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>Konfiguracja serwera poczty wychodzącej</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Adres serwera SMTP</label>
            <input type="text" name="smtpServer" className="form-input" placeholder="np. smtp.gmail.com" value={settings.smtpServer} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Port SMTP</label>
            <input type="number" name="smtpPort" className="form-input" placeholder="465 lub 587" value={settings.smtpPort} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Szyfrowanie</label>
            <CustomSelect 
              name="smtpEncryption" 
              className="form-input" 
              value={settings.smtpEncryption} 
              onChange={handleChange as any}
              options={[
                { value: "SSL/TLS", label: "SSL/TLS" },
                { value: "STARTTLS", label: "STARTTLS" },
                { value: "Brak", label: "Brak" }
              ]}
            />
          </div>
          <div className="form-group">
            <label>Nazwa użytkownika (Login)</label>
            <input type="text" name="smtpUser" className="form-input" placeholder="biuro@takserwis.pl" value={settings.smtpUser} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Hasło</label>
            <input type="password" name="smtpPassword" className="form-input" placeholder="••••••••" value={settings.smtpPassword} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-xl)' }}>
          <button className="btn btn-secondary">Wyślij e-mail testowy</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Zapisywanie...' : 'Zapisz konfigurację'}
          </button>
        </div>
      </div>
    </div>
  );
}
