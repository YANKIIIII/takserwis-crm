'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconFileText, IconCheck, IconWallet } from '@/components/Icons';

const statusMap: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Szkic', cls: 'badge-pending' },
  sent: { label: 'Wysłana', cls: 'badge-in-progress' },
  paid: { label: 'Opłacona', cls: 'badge-done' },
  overdue: { label: 'Zaległe', cls: '' },
};

export default function SalesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sales')
      .then(res => res.json())
      .then(data => {
        setInvoices(data);
        setLoading(false);
      });
  }, []);

  const totalRevenue = invoices.reduce((s, i) => s + i.totalValue, 0);
  const paidCount = invoices.filter(i => i.status === 'paid').length;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Sprzedaż</h1><p className="page-subtitle">Faktury i dokumenty sprzedaży</p></div>
        <Link href="/warehouse/new?type=FV" className="btn btn-primary">+ Nowa faktura</Link>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon orange"><IconFileText /></div><div><div className="stat-value">{invoices.length}</div><div className="stat-label">Faktury</div></div></div>
        <div className="stat-card"><div className="stat-icon green"><IconCheck /></div><div><div className="stat-value">{paidCount}</div><div className="stat-label">Opłacone</div></div></div>
        <div className="stat-card"><div className="stat-icon blue"><IconWallet /></div><div><div className="stat-value">{totalRevenue.toLocaleString('pl-PL')} zł</div><div className="stat-label">Łączna wartość</div></div></div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Typ</th><th>Nr dokumentu</th><th>Klient</th><th>Pozycje</th><th>Kwota</th><th>Status</th><th>Data</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>Ładowanie danych...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>Brak dokumentów sprzedaży</td></tr>
            ) : invoices.map(inv => {
              const s = statusMap[inv.status] || { label: inv.status, cls: '' };
              const dateStr = inv.date ? new Date(inv.date).toISOString().split('T')[0] : '';
              const itemsStr = inv.itemsCount ? `${inv.itemsCount} poz.` : 'Brak pozycji';
              const typeLabel = inv.type === 'FV' ? 'Faktura' : inv.type === 'PA' ? 'Paragon' : (inv.id.startsWith('wo') ? 'Zlecenie' : inv.type);
              return (<tr key={inv.id}><td><span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{typeLabel || 'Dokument'}</span></td><td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{inv.documentNumber}</td><td style={{ fontWeight: 500 }}>{inv.contractorName}</td><td style={{ color: 'var(--text-secondary)' }}>{itemsStr}</td><td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--orange)' }}>{inv.totalValue.toLocaleString('pl-PL')} zł</td><td><span className={`badge ${s.cls}`} style={inv.status === 'overdue' ? { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' } : {}}><span className="badge-dot"/>{s.label}</span></td><td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{dateStr}</td></tr>);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
