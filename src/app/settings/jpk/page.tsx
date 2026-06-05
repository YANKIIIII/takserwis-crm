'use client';

import { useState, useEffect } from 'react';
import { CustomSelect } from '@/components/CustomSelect';
import { useDialog } from '@/contexts/DialogContext';

export default function JPKSettings() {
  const { showAlert } = useDialog();
  const [settings, setSettings] = useState({
    jpkDefaultGtu: 'Brak',
    jpkDefaultProcedures: '',
    jpkAutoInvoices: 'false'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings({
          jpkDefaultGtu: data.jpkDefaultGtu || 'Brak',
          jpkDefaultProcedures: data.jpkDefaultProcedures || '',
          jpkAutoInvoices: data.jpkAutoInvoices || 'false'
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        await showAlert('Konfiguracja JPK zapisana!');
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
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Konfiguracja JPK_V7</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2xl)' }}>
        Ustawienia generowania Jednolitego Pliku Kontrolnego dla usług księgowych.
      </p>

      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>Parametry domyślne dla faktur</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <div className="form-group">
            <label>Domyślny kod GTU dla usług serwisowych</label>
            <CustomSelect 
              name="jpkDefaultGtu" 
              className="form-input" 
              value={settings.jpkDefaultGtu} 
              onChange={handleChange as any}
              options={[
                { value: "Brak", label: "Brak" },
                { value: "GTU_01 - Dostawa napojów alkoholowych", label: "GTU_01 - Dostawa napojów alkoholowych" },
                { value: "GTU_08 - Metale szlachetne", label: "GTU_08 - Metale szlachetne" },
                { value: "GTU_12 - Usługi o charakterze niematerialnym", label: "GTU_12 - Usługi o charakterze niematerialnym" }
              ]}
            />
          </div>
          
          <div className="form-group">
            <label>Kody procedur (np. MPP, TP, RO)</label>
            <input type="text" name="jpkDefaultProcedures" className="form-input" placeholder="Wpisz domyślne kody po przecinku" value={settings.jpkDefaultProcedures} onChange={handleChange} />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <input type="checkbox" name="jpkAutoInvoices" id="auto-jpk" style={{ width: '18px', height: '18px' }} checked={settings.jpkAutoInvoices === 'true'} onChange={handleChange} />
            <label htmlFor="auto-jpk" style={{ marginBottom: 0 }}>Automatycznie oznaczaj paragony z NIP jako faktury w pliku JPK</label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Zapisywanie...' : 'Zapisz konfigurację JPK'}
          </button>
        </div>
      </div>
    </div>
  );
}
