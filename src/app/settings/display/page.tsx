'use client';

import { useState, useEffect } from 'react';
import { CustomSelect } from '@/components/CustomSelect';

export default function DisplaySettings() {
  const [settings, setSettings] = useState({
    darkMode: 'false',
    tableDensity: 'Standardowa',
    hideChat: 'false'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings({
          darkMode: data.darkMode || 'false',
          tableDensity: data.tableDensity || 'Standardowa',
          hideChat: data.hideChat || 'false'
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (name: string, value: string) => {
    const newSettings = { ...settings, [name]: value };
    setSettings(newSettings);
    
    // Auto-save display settings
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [name]: value })
    });
  };

  if (loading) return <div>Ładowanie...</div>;

  const isDarkMode = settings.darkMode === 'true';
  const isChatHidden = settings.hideChat === 'true';

  return (
    <div style={{ maxWidth: '800px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Ustawienia ekranu</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2xl)' }}>
        Dostosuj wygląd i zachowanie interfejsu aplikacji do swoich preferencji.
      </p>

      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>Wygląd</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Tryb ciemny</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ciemne tło redukuje zmęczenie oczu.</div>
            </div>
            <div 
              onClick={() => handleChange('darkMode', isDarkMode ? 'false' : 'true')}
              style={{
                width: '40px',
                height: '24px',
                background: isDarkMode ? 'var(--orange)' : 'var(--border)',
                borderRadius: '12px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.3s'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                left: isDarkMode ? '18px' : '2px',
                width: '20px',
                height: '20px',
                background: 'white',
                borderRadius: '50%',
                transition: 'left 0.3s'
              }} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Gęstość tabel</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ilość przestrzeni wokół elementów na listach.</div>
            </div>
            <CustomSelect 
              name="tableDensity"
              className="form-input" 
              style={{ width: '150px' }}
              value={settings.tableDensity}
              onChange={(e) => handleChange('tableDensity', e.target.value)}
              options={[
                { value: "Luźna", label: "Luźna" },
                { value: "Standardowa", label: "Standardowa" },
                { value: "Kompaktowa", label: "Kompaktowa" }
              ]}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Ukryj moduł czatu</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Jeśli nie korzystasz z komunikatora wewnątrz firmy.</div>
            </div>
            <div 
              onClick={() => handleChange('hideChat', isChatHidden ? 'false' : 'true')}
              style={{
                width: '40px',
                height: '24px',
                background: isChatHidden ? 'var(--orange)' : 'var(--border)',
                borderRadius: '12px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.3s'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                left: isChatHidden ? '18px' : '2px',
                width: '20px',
                height: '20px',
                background: 'white',
                borderRadius: '50%',
                transition: 'left 0.3s'
              }} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
