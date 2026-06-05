'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDialog } from '@/contexts/DialogContext';

function CashForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useDialog();
  const [loading, setLoading] = useState(false);

  const type = searchParams.get('type') === 'KW' ? 'KW' : 'KP';

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    
    try {
      const res = await fetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          documentNumber: form.get('documentNumber'),
          date: form.get('date'),
          amount: form.get('amount'),
          clientName: form.get('clientName'),
          description: form.get('description')
        }),
      });

      if (res.ok) {
        router.push('/cash');
      } else {
        await showAlert('Błąd podczas zapisywania dokumentu.');
      }
    } catch (err) {
      console.error(err);
      await showAlert('Wystąpił błąd.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 className="page-title" style={{ color: type === 'KP' ? 'var(--success)' : 'var(--danger)' }}>
          {type === 'KP' ? 'Nowy Dowód Wpłaty (KP)' : 'Nowy Dowód Wypłaty (KW)'}
        </h1>
        <p className="page-subtitle">Wypełnij dane transakcji kasowej</p>
      </div>

      <form onSubmit={handleCreate}>
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Szczegóły operacji</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label>Numer dokumentu *</label>
              <input required type="text" name="documentNumber" className="form-input" placeholder={type === 'KP' ? 'np. KP/1/2026' : 'np. KW/1/2026'} />
            </div>

            <div className="form-group">
              <label>Data *</label>
              <input required type="date" name="date" className="form-input" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>

            <div className="form-group">
              <label>Kwota (PLN) *</label>
              <input required type="number" step="0.01" min="0.01" name="amount" className="form-input" placeholder="0.00" />
            </div>

            <div className="form-group">
              <label>Klient / Kontrahent</label>
              <input type="text" name="clientName" className="form-input" placeholder="Opcjonalnie" />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Tytułem (Opis)</label>
              <input type="text" name="description" className="form-input" placeholder="Za co płatność" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.push('/cash')}>
              Anuluj
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Zapisywanie...' : (type === 'KP' ? 'Wpłać' : 'Wypłać')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CashFormPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>Ładowanie...</div>}>
      <CashForm />
    </Suspense>
  );
}
