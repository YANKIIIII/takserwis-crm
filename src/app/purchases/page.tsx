'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconPackage, IconTruck, IconCheck, IconWallet } from '@/components/Icons';

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Oczekuje', cls: 'badge-pending' },
  ordered: { label: 'Zamówione', cls: 'badge-in-progress' },
  delivered: { label: 'Dostarczone', cls: 'badge-done' },
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/purchases')
      .then(res => res.json())
      .then(data => {
        setPurchases(data);
        setLoading(false);
      });
  }, []);

  const totalValue = purchases.reduce((sum, p) => sum + p.totalValue, 0);
  const deliveredCount = purchases.filter(p => p.status === 'delivered').length;
  const inProgressCount = purchases.filter(p => p.status === 'ordered').length;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Zakupy</h1><p className="page-subtitle">Zamówienia u dostawców</p></div>
        <Link href="/warehouse/new?type=PZ" className="btn btn-primary">+ Nowy dokument (PZ)</Link>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon orange"><IconPackage /></div><div><div className="stat-value">{purchases.length}</div><div className="stat-label">Wszystkich zamówień</div></div></div>
        <div className="stat-card"><div className="stat-icon blue"><IconTruck /></div><div><div className="stat-value">{inProgressCount}</div><div className="stat-label">W drodze</div></div></div>
        <div className="stat-card"><div className="stat-icon green"><IconCheck /></div><div><div className="stat-value">{deliveredCount}</div><div className="stat-label">Dostarczonych</div></div></div>
        <div className="stat-card"><div className="stat-icon red"><IconWallet /></div><div><div className="stat-value">{totalValue.toLocaleString('pl-PL')} zł</div><div className="stat-label">Wartość zamówień</div></div></div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Nr</th><th>Dostawca</th><th>Pozycje</th><th>Kwota</th><th>Status</th><th>Data</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Ładowanie danych...</td></tr>
            ) : purchases.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Brak faktur</td></tr>
            ) : purchases.map(p => {
              const s = statusMap[p.status] || { label: p.status, cls: '' };
              const dateStr = p.date ? new Date(p.date).toISOString().split('T')[0] : '';
              const itemsStr = p.itemsCount ? `${p.itemsCount} poz.` : 'Brak pozycji';
              return (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{p.documentNumber}</td>
                  <td style={{ fontWeight: 500 }}>{p.contractorName}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{itemsStr}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.totalValue.toLocaleString('pl-PL')} zł</td>
                  <td><span className={`badge ${s.cls}`}><span className="badge-dot"/>{s.label}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{dateStr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
