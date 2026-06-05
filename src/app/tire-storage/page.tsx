'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDialog } from '@/contexts/DialogContext';

export default function TireStoragePage() {
  const [storages, setStorages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showConfirm, showAlert } = useDialog();

  const loadData = () => {
    fetch('/api/tire-storage')
      .then(r => r.json())
      .then(data => {
        setStorages(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Przechowalnia Opon</h1>
          <p className="page-subtitle">Zarządzaj przechowywanymi oponami i kołami klientów</p>
        </div>
        <Link href="/tire-storage/form" className="btn btn-primary">+ Przyjęcie do przechowalni</Link>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>Ładowanie...</div>
        ) : storages.length > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Klient</th>
                  <th>Pojazd</th>
                  <th>Typ / Sezon</th>
                  <th>Marka i Model</th>
                  <th>Miejsce</th>
                  <th>Data Przyjęcia</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {storages.map(ts => (
                  <tr key={ts.id}>
                    <td>
                      <span className={`badge ${ts.status === 'W magazynie' ? 'badge-in-progress' : 'badge-done'}`}>
                        <span className="badge-dot" />
                        {ts.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <Link href={`/customers/${ts.customerId}`} className="text-link">
                        {ts.customer?.firstName} {ts.customer?.lastName} {ts.customer?.companyName}
                      </Link>
                    </td>
                    <td>{ts.vehicle ? `${ts.vehicle.brand} ${ts.vehicle.model} (${ts.vehicle.plate})` : '—'}</td>
                    <td>{ts.type} ({ts.season})</td>
                    <td>{ts.brandAndModel}</td>
                    <td>{ts.storageLocation || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(ts.depositDate).toLocaleDateString('pl-PL')}</td>
                    <td>
                      {ts.status === 'W magazynie' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ marginRight: '8px' }}
                          onClick={async () => {
                            const confirmed = await showConfirm('Czy na pewno wydać opony klientowi?');
                            if (!confirmed) return;
                            const res = await fetch(`/api/tire-storage/${ts.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'Wydane' })
                            });
                            if (res.ok) {
                              loadData();
                            } else {
                              await showAlert('Wystąpił błąd podczas wydawania opon.');
                            }
                          }}
                        >
                          Wydaj
                        </button>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={() => window.open(`/print-tire-storage/${ts.id}`, '_blank')}>Drukuj</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
            Brak wpisów w przechowalni.
          </div>
        )}
      </div>
    </div>
  );
}
