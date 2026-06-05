'use client';
import { useState, useEffect } from 'react';
import type { CashDocument } from '@prisma/client';
import { IconTrendUp, IconTrendDown, IconWallet } from '@/components/Icons';
import { useDialog } from '@/contexts/DialogContext';
import { useRouter } from 'next/navigation';

export default function CashPage() {
  const { showAlert, showConfirm } = useDialog();
  const router = useRouter();
  const [transactions, setTransactions] = useState<CashDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    fetch('/api/cash')
      .then(res => res.json())
      .then(data => {
        setTransactions(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // handleSave moved to /cash/form

  const handleDelete = async (id: number) => {
    if (await showConfirm('Czy na pewno chcesz usunąć tę operację kasową? (Tej akcji nie można cofnąć)')) {
      const res = await fetch(`/api/cash/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        await showAlert('Błąd podczas usuwania.');
      }
    }
  };

  const income = transactions.filter(t => t.type === 'KP').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'KW').reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance = income - expenses;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Kasa</h1>
          <p className="page-subtitle">Przegląd finansów i transakcji</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => router.push('/cash/form?type=KP')}>+ Przychód (KP)</button>
          <button className="btn btn-secondary" onClick={() => router.push('/cash/form?type=KW')}>- Wydatek (KW)</button>
        </div>
      </div>
      
      {loading ? (
        <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>Ładowanie danych...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon green"><IconTrendUp /></div><div><div className="stat-value" style={{ color: 'var(--success)' }}>+{income.toLocaleString('pl-PL')} zł</div><div className="stat-label">Przychody (KP)</div></div></div>
            <div className="stat-card"><div className="stat-icon red"><IconTrendDown /></div><div><div className="stat-value" style={{ color: 'var(--danger)' }}>-{expenses.toLocaleString('pl-PL')} zł</div><div className="stat-label">Wydatki (KW)</div></div></div>
            <div className="stat-card"><div className="stat-icon orange"><IconWallet /></div><div><div className="stat-value" style={{ color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>{balance >= 0 ? '+' : ''}{balance.toLocaleString('pl-PL')} zł</div><div className="stat-label">Saldo</div></div></div>
          </div>
          
          <div className="table-wrapper" style={{ marginTop: 'var(--space-xl)' }}>
            <h3 style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border)' }}>Historia transakcji</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Dokument</th>
                  <th>Opis</th>
                  <th>Metoda</th>
                  <th>Kwota</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString('pl-PL')}</td>
                    <td style={{ fontWeight: 500 }}>{t.documentNumber}</td>
                    <td>{t.description || '-'}</td>
                    <td><span className={`badge ${t.type === 'KP' ? 'badge-done' : 'badge-pending'}`}>{t.type}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: t.type === 'KP' ? 'var(--success)' : 'var(--danger)' }}>{t.type === 'KP' ? '+' : '-'}{Math.abs(t.amount).toLocaleString('pl-PL')} zł</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--red)' }} onClick={() => handleDelete(t.id)}>Usuń</button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Brak transakcji kasowych.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
}
