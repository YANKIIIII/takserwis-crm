'use client';
import { useEffect, useState } from 'react';
import { CustomSelect } from '@/components/CustomSelect';
import { EmptyState } from '@/components/EmptyState';

interface Vehicle {
  id: number; brand: string; model: string; year: number | null; vin: string | null;
  plate: string; mileage: number | null; customer: { firstName: string; lastName: string; phone: string };
  _count: { workOrders: number };
}

import { useRouter } from 'next/navigation';

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');

  useEffect(() => {
    fetch('/api/vehicles').then(r => r.json()).then(setVehicles);
  }, []);

  const brands = ['all', ...new Set(vehicles.map(v => v.brand).filter(Boolean))].sort();

  const filtered = vehicles.filter(v =>
    (brandFilter === 'all' || v.brand === brandFilter) &&
    `${v.brand} ${v.model} ${v.plate} ${v.vin || ''} ${v.customer.firstName} ${v.customer.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Pojazdy</h1><p className="page-subtitle">Rejestr pojazdów klientów</p></div>
      </div>
      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
          <svg className="search-bar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="form-input" placeholder="Szukaj pojazdu..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <CustomSelect 
          name="brandFilter"
          className="form-select" 
          value={brandFilter} 
          onChange={e => setBrandFilter(e.target.value)} 
          style={{ minWidth: 160, width: 160 }}
          options={[
            { value: "all", label: "Wszystkie marki" },
            ...brands.filter(b => b !== 'all').map(b => ({ value: b, label: b }))
          ]}
        />
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Pojazd</th><th>Nr rejestracyjny</th><th>VIN</th><th>Rok</th><th>Przebieg</th><th>Właściciel</th><th>Zlecenia</th></tr></thead>
          <tbody>
            {filtered.map(v => (
              <tr 
                key={v.id} 
                onClick={() => router.push(`/vehicles/${v.id}`)}
                style={{ cursor: 'pointer' }}
                className="hover-row"
              >
                <td style={{ fontWeight: 600 }}>{v.brand} {v.model}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{v.plate}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{v.vin || '—'}</td>
                <td>{v.year || '—'}</td>
                <td>{v.mileage ? `${v.mileage.toLocaleString()} km` : '—'}</td>
                <td>{v.customer.firstName} {v.customer.lastName}</td>
                <td><span className="badge badge-in-progress">{v._count.workOrders}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <EmptyState message="Brak pojazdów" />}
    </div>
  );
}
