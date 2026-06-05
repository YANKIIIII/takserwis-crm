'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconPackage, IconAlertTriangle, IconTrendUp, IconTrendDown } from '@/components/Icons';

export default function WarehousePage() {
  const [data, setData] = useState<{ documents: any[], totalItems: number } | null>(null);

  useEffect(() => {
    fetch('/api/warehouse/dashboard')
      .then(res => res.json())
      .then(d => setData(d));
  }, []);

  if (!data) return <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>Ładowanie danych...</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Magazyn</h1><p className="page-subtitle">Stan asortymentu i ruchy magazynowe</p></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/warehouse/new?type=PZ" className="btn btn-secondary">Dokument PZ</Link>
          <Link href="/warehouse/new?type=WZ" className="btn btn-secondary">Dokument WZ</Link>
          <Link href="/products" className="btn btn-primary">+ Dodaj produkt</Link>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon" style={{ color: 'var(--text-primary)' }}><IconPackage /></div><div><div className="stat-value">{data.totalItems}</div><div className="stat-label">Unikalnych produktów</div></div></div>
        <div className="stat-card"><div className="stat-icon green"><IconTrendUp /></div><div><div className="stat-value">+{data.documents.filter((d: any) => d.type === 'PZ').length}</div><div className="stat-label">Przyjęcia (ostatnie dni)</div></div></div>
        <div className="stat-card"><div className="stat-icon red"><IconTrendDown /></div><div><div className="stat-value">-{data.documents.filter((d: any) => d.type === 'WZ').length}</div><div className="stat-label">Wydania (ostatnie dni)</div></div></div>
        <div className="stat-card"><div className="stat-icon orange"><IconAlertTriangle /></div><div><div className="stat-value" style={{ color: 'var(--orange)' }}>0</div><div className="stat-label">Niski stan</div></div></div>
      </div>
      <div className="table-wrapper" style={{ marginTop: 'var(--space-xl)' }}>
        <h3 style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border)' }}>Ostatnie ruchy (Dokumenty)</h3>
        <table className="data-table">
          <thead><tr><th>Data</th><th>Dokument</th><th>Typ</th><th>Kontrahent</th></tr></thead>
          <tbody>
            {data.documents.map((d: any) => (
              <tr key={d.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(d.createdAt).toLocaleDateString('pl-PL')}</td>
                <td style={{ fontWeight: 500 }}>{d.documentNumber}</td>
                <td><span className={`badge ${d.type === 'PZ' ? 'badge-completed' : 'badge-in-progress'}`}>{d.type === 'PZ' ? 'Przyjęcie' : 'Wydanie'} ({d.type})</span></td>
                <td>{d.contractorName || '-'}</td>
              </tr>
            ))}
            {data.documents.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>Brak ostatnich dokumentów magazynowych.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
