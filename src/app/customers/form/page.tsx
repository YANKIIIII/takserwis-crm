'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDialog } from '@/contexts/DialogContext';

export default function CustomerFormPage() {
  const router = useRouter();
  const { showAlert } = useDialog();
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const body = {
      firstName: form.get('firstName'),
      lastName: form.get('lastName'),
      phone: form.get('phone'),
      email: form.get('email'),
      notes: form.get('notes'),
      vehicle: form.get('v_plate')
        ? {
            brand: form.get('v_brand'),
            model: form.get('v_model'),
            year: form.get('v_year'),
            vin: form.get('v_vin'),
            plate: form.get('v_plate'),
            mileage: form.get('v_mileage'),
          }
        : null,
    };

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push('/customers');
      } else {
        await showAlert('Błąd podczas zapisywania klienta.');
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
        <h1 className="page-title">Nowy klient</h1>
        <p className="page-subtitle">Wprowadź dane klienta i jego pojazdu</p>
      </div>

      <form onSubmit={handleCreate}>
        <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Dane klienta</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label>Imię *</label>
              <input required type="text" name="firstName" className="form-input" placeholder="np. Jan" />
            </div>
            
            <div className="form-group">
              <label>Nazwisko *</label>
              <input required type="text" name="lastName" className="form-input" placeholder="np. Kowalski" />
            </div>

            <div className="form-group">
              <label>Telefon *</label>
              <input required type="text" name="phone" className="form-input" placeholder="+48 600 123 456" />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" className="form-input" placeholder="email@example.com" />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Notatki</label>
              <textarea name="notes" className="form-textarea" placeholder="Stały klient, korporacyjny..." />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--orange)' }}>
              <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-6 0H9"/>
            </svg>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Pojazd (opcjonalnie)</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label>Marka</label>
              <input type="text" name="v_brand" className="form-input" placeholder="BMW" />
            </div>
            
            <div className="form-group">
              <label>Model</label>
              <input type="text" name="v_model" className="form-input" placeholder="320d F30" />
            </div>

            <div className="form-group">
              <label>Nr rejestracyjny</label>
              <input type="text" name="v_plate" className="form-input" placeholder="WA 12345" />
            </div>

            <div className="form-group">
              <label>Rok produkcji</label>
              <input type="number" name="v_year" className="form-input" placeholder="2020" />
            </div>

            <div className="form-group">
              <label>VIN</label>
              <input type="text" name="v_vin" className="form-input" placeholder="WBAJB51060G843241" />
            </div>

            <div className="form-group">
              <label>Przebieg (km)</label>
              <input type="number" name="v_mileage" className="form-input" placeholder="125000" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.push('/customers')}>
              Anuluj
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zapisz klienta'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
