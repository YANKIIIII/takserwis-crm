'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDialog } from '@/contexts/DialogContext';

function VehicleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useDialog();
  const customerId = searchParams.get('customerId');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customerId) {
      await showAlert('Brak ID klienta. Wróć do karty klienta.');
      return;
    }

    setLoading(true);
    const form = new FormData(e.currentTarget);
    
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: form.get('brand'),
          model: form.get('model'),
          year: form.get('year'),
          vin: form.get('vin'),
          plate: form.get('plate'),
          mileage: form.get('mileage'),
          customerId: customerId,
        }),
      });

      if (res.ok) {
        router.push(`/customers/${customerId}`);
      } else {
        await showAlert('Błąd podczas zapisywania pojazdu.');
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
        <h1 className="page-title">Nowy pojazd</h1>
        <p className="page-subtitle">Dodaj pojazd do karty klienta</p>
      </div>

      <form onSubmit={handleCreate}>
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Dane pojazdu</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label>Marka *</label>
              <input required type="text" name="brand" className="form-input" placeholder="np. BMW, Honda..." />
            </div>

            <div className="form-group">
              <label>Model *</label>
              <input required type="text" name="model" className="form-input" placeholder="np. R1200GS, CBR600..." />
            </div>

            <div className="form-group">
              <label>Numer rejestracyjny *</label>
              <input required type="text" name="plate" className="form-input" placeholder="np. WA 12345" />
            </div>

            <div className="form-group">
              <label>VIN</label>
              <input type="text" name="vin" className="form-input" placeholder="17 znaków" />
            </div>

            <div className="form-group">
              <label>Rok produkcji</label>
              <input type="number" name="year" className="form-input" placeholder="2020" />
            </div>

            <div className="form-group">
              <label>Przebieg (km)</label>
              <input type="number" name="mileage" className="form-input" placeholder="45000" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
              Anuluj
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zapisz pojazd'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function VehicleFormPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>Ładowanie...</div>}>
      <VehicleForm />
    </Suspense>
  );
}
