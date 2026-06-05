'use client';

import { useState, useEffect } from 'react';
import { useDialog } from '@/contexts/DialogContext';

type Workshop = {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
};

export default function WorkshopsSettings() {
  const { showAlert } = useDialog();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.workshopsList) {
          try {
            setWorkshops(JSON.parse(data.workshopsList));
          } catch (e) {
            console.error('Failed to parse workshops');
          }
        } else {
          // Default data if empty
          setWorkshops([
            { id: '1', name: 'Główna siedziba', address: 'ul. Składowa 33, Przeźmierowo', isActive: true },
            { id: '2', name: 'Oddział Węglowa', address: 'ul. Węglowa 9/11, Poznań', isActive: false },
            { id: '3', name: 'Oddział św. Antoniego', address: 'ul. św. Antoniego 68C, Poznań', isActive: false }
          ]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const saveWorkshops = async (newList: Workshop[]) => {
    setWorkshops(newList);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workshopsList: JSON.stringify(newList) })
    });
  };

  const handleSetActive = (id: string) => {
    const newList = workshops.map(w => ({
      ...w,
      isActive: w.id === id
    }));
    saveWorkshops(newList);
  };

  const handleAdd = () => {
    const name = prompt('Nazwa warsztatu:');
    if (!name) return;
    const address = prompt('Adres:');
    if (!address) return;
    
    const newWorkshop: Workshop = {
      id: Date.now().toString(),
      name,
      address,
      isActive: false
    };
    saveWorkshops([...workshops, newWorkshop]);
  };

  if (loading) return <div>Ładowanie...</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Zarządzanie warsztatami</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2xl)' }}>
        Dodawaj i przełączaj się między wieloma lokalizacjami swojego serwisu.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        
        {workshops.map(w => (
          <div key={w.id} className="card" style={{ padding: 'var(--space-xl)', position: 'relative', border: w.isActive ? '2px solid var(--orange)' : 'none', display: 'flex', flexDirection: 'column' }}>
            {w.isActive ? (
              <div style={{ position: 'absolute', top: 'var(--space-md)', right: 'var(--space-md)', background: 'var(--orange-bg)', color: 'var(--orange-high)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Aktywny</div>
            ) : (
              <div style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
            )}
            
            {w.isActive && (
              <div style={{ width: '48px', height: '48px', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-md)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
            )}

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>{w.name}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>{w.address}</p>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={async () => await showAlert('Edycja w przygotowaniu')}>Edytuj</button>
              {!w.isActive && (
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleSetActive(w.id)}>Przełącz</button>
              )}
            </div>
          </div>
        ))}

        {/* Add new */}
        <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', background: 'transparent', cursor: 'pointer' }} onClick={handleAdd}>
          <div style={{ width: '48px', height: '48px', background: 'var(--bg-body)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-md)', color: 'var(--text-muted)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Dodaj nowy warsztat</h3>
        </div>

      </div>
    </div>
  );
}
