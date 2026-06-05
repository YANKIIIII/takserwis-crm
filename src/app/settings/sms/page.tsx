'use client';

import { useState, useEffect } from 'react';
import { useDialog } from '@/contexts/DialogContext';

export default function SMSSettings() {
  const { showAlert } = useDialog();
  const [settings, setSettings] = useState({
    smsSenderName: 'TAK SERWIS',
    smsTemplateReady: 'Witaj [Imię], Twój pojazd [Marka] [Rejestracja] jest gotowy do odbioru w naszym serwisie. Do zapłaty: [Kwota] zł. Zapraszamy do [GodzinaZamkniecia].',
    smsTemplateReadyAuto: 'true',
    smsTemplateReminder: 'Przypominamy o umówionej wizycie w dniu [DataWizyty] o godzinie [GodzinaWizyty]. Prosimy o punktualne przybycie.',
    smsTemplateReminderAuto: 'true'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings({
          smsSenderName: data.smsSenderName || 'TAK SERWIS',
          smsTemplateReady: data.smsTemplateReady || 'Witaj [Imię], Twój pojazd [Marka] [Rejestracja] jest gotowy do odbioru w naszym serwisie. Do zapłaty: [Kwota] zł. Zapraszamy do [GodzinaZamkniecia].',
          smsTemplateReadyAuto: data.smsTemplateReadyAuto || 'true',
          smsTemplateReminder: data.smsTemplateReminder || 'Przypominamy o umówionej wizycie w dniu [DataWizyty] o godzinie [GodzinaWizyty]. Prosimy o punktualne przybycie.',
          smsTemplateReminderAuto: data.smsTemplateReminderAuto || 'true'
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings(prev => ({ ...prev, [name]: checked ? 'true' : 'false' }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
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
        await showAlert('Ustawienia SMS zapisane!');
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
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Bramka SMS</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2xl)' }}>
        Wysyłaj automatyczne powiadomienia do klientów (np. o gotowym do odbioru pojeździe).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <div className="card" style={{ padding: 'var(--space-xl)', background: 'var(--bg-body)', border: '2px solid var(--orange)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--text-primary)' }}>1 240</div>
          <div style={{ color: 'var(--text-muted)' }}>dostępnych SMS-ów</div>
          <button className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }}>Doładuj konto</button>
        </div>

        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Nazwa nadawcy</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
            Ta nazwa pojawi się jako nadawca wiadomości w telefonie klienta (max 11 znaków).
          </p>
          <div className="form-group">
            <input type="text" name="smsSenderName" className="form-input" value={settings.smsSenderName} onChange={handleChange} maxLength={11} />
          </div>
          <button className="btn btn-secondary" onClick={handleSave} disabled={saving}>
            {saving ? 'Zapisywanie...' : 'Aktualizuj'}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>Szablony wiadomości</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ border: '1px solid var(--border)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600 }}>Pojazd gotowy do odbioru</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <input type="checkbox" name="smsTemplateReadyAuto" checked={settings.smsTemplateReadyAuto === 'true'} onChange={handleChange} /> Aktywny automatycznie
              </label>
            </div>
            <textarea name="smsTemplateReady" className="form-input" style={{ height: '80px', fontFamily: 'monospace' }} value={settings.smsTemplateReady} onChange={handleChange} />
          </div>

          <div style={{ border: '1px solid var(--border)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600 }}>Przypomnienie o wizycie</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <input type="checkbox" name="smsTemplateReminderAuto" checked={settings.smsTemplateReminderAuto === 'true'} onChange={handleChange} /> Aktywny automatycznie (24h przed)
              </label>
            </div>
            <textarea name="smsTemplateReminder" className="form-input" style={{ height: '80px', fontFamily: 'monospace' }} value={settings.smsTemplateReminder} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Zapisywanie...' : 'Zapisz szablony'}
          </button>
        </div>
      </div>
    </div>
  );
}
