'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CustomSelect } from '@/components/CustomSelect';
import { useDialog } from '@/contexts/DialogContext';

interface Mechanic {
  id: number;
  name: string;
  specialization: string | null;
  phone: string | null;
  status: string;
  _count: { workOrders: number };
}

const statusLabels: Record<string, { label: string; className: string }> = {
  available: { label: 'Wolny', className: 'badge-done' },
  busy: { label: 'Zajęty', className: 'badge-in-progress' },
  off: { label: 'Dzień wolny', className: 'badge-pending' },
};

export default function MechanicsPage() {
  const { showAlert, showConfirm } = useDialog();
  const router = useRouter();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadMechanics = useCallback(() => {
    fetch('/api/mechanics').then((r) => r.json()).then(setMechanics);
  }, []);

  useEffect(() => {
    loadMechanics();
  }, [loadMechanics]);

  // handleCreate moved to /mechanics/form

  const filteredMechanics = mechanics.filter(m => {
    const matchesSearch = `${m.name} ${m.specialization || ''} ${m.phone || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: number) => {
    if (await showConfirm('Czy na pewno chcesz usunąć tego mechanika?')) {
      const res = await fetch(`/api/mechanics/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadMechanics();
      } else {
        await showAlert('Błąd usuwania');
      }
    }
  };

  const handleStatusToggle = async (m: Mechanic) => {
    const statuses = ['available', 'busy', 'off'];
    const nextIdx = (statuses.indexOf(m.status) + 1) % statuses.length;
    const nextStatus = statuses[nextIdx];

    // Optimistic update
    setMechanics(prev => prev.map(x => x.id === m.id ? { ...x, status: nextStatus } : x));

    try {
      const res = await fetch(`/api/mechanics/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...m, status: nextStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch (e) {
      loadMechanics();
      await showAlert('Błąd podczas zmiany statusu');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Mechanicy</h1>
          <p className="page-subtitle">Zarządzanie personelem warsztatu</p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/mechanics/form')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Dodaj mechanika
        </button>
      </div>

      {/* Search & Filters */}
      <div className="filter-bar">
        <div className="search-bar">
          <svg className="search-bar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="form-input" placeholder="Szukaj mechanika..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <CustomSelect 
          name="statusFilter"
          className="form-select" 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)} 
          style={{ minWidth: 160, width: 160 }}
          options={[
            { value: "all", label: "Wszystkie statusy" },
            ...Object.entries(statusLabels).map(([key, { label }]) => ({ value: key, label }))
          ]}
        />
      </div>

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
        {filteredMechanics.map((m) => {
          const st = statusLabels[m.status] || statusLabels.available;
          return (
            <div 
              key={m.id} 
              className="card" 
              style={{ position: 'relative', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onClick={() => router.push(`/mechanics/form?id=${m.id}`)}
            >
              <div style={{ position: 'absolute', top: 10, right: 10 }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--red)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(m.id);
                  }}
                >
                  Usuń
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--orange-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--orange)',
                    flexShrink: 0,
                    border: '1px solid var(--orange-border)',
                  }}>
                    {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{m.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {m.specialization || 'Uniwersalny'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <span 
                  className={`badge ${st.className}`}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusToggle(m);
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  title="Kliknij, aby zmienić status"
                >
                  <span className="badge-dot" />
                  {st.label}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-xl)', fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: 'var(--space-md)' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Tel: </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{m.phone || '—'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Zleceń: </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m._count.workOrders}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMechanics.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
          Nie znaleziono mechaników spełniających kryteria.
        </div>
      )}

    </div>
  );
}
