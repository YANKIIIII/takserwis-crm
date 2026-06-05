'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDialog } from '@/contexts/DialogContext';
import { CustomSelect } from '@/components/CustomSelect';

function MechanicForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useDialog();
  const id = searchParams.get('id');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);

  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    phone: '',
    status: 'available',
  });

  useEffect(() => {
    if (id) {
      fetch(`/api/mechanics/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(data => {
          setFormData({
            name: data.name || '',
            specialization: data.specialization || '',
            phone: data.phone || '',
            status: data.status || 'available',
          });
        })
        .catch(() => {
          router.push('/mechanics');
        })
        .finally(() => setFetching(false));
    }
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (id) {
        const res = await fetch(`/api/mechanics/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          router.push('/mechanics');
        } else {
          await showAlert('Błąd podczas aktualizacji mechanika.');
        }
      } else {
        const res = await fetch('/api/mechanics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          router.push('/mechanics');
        } else {
          await showAlert('Błąd podczas zapisywania mechanika.');
        }
      }
    } catch (err) {
      console.error(err);
      await showAlert('Wystąpił błąd.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>Ładowanie...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 className="page-title">{id ? 'Edytuj mechanika' : 'Nowy mechanik'}</h1>
        <p className="page-subtitle">Zarządzanie pracownikiem warsztatu</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Dane mechanika</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Imię i nazwisko *</label>
              <input required type="text" name="name" className="form-input" placeholder="np. Tomasz Kowalski" value={formData.name} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label>Specjalizacja</label>
              <input type="text" name="specialization" className="form-input" placeholder="np. Silniki, Elektryka..." value={formData.specialization} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Telefon</label>
              <input type="text" name="phone" className="form-input" placeholder="+48 600 111 222" value={formData.phone} onChange={handleChange} />
            </div>

            {id && (
              <div className="form-group">
                <label>Status</label>
                <CustomSelect 
                  name="status"
                  className="form-select"
                  value={formData.status}
                  onChange={handleChange as any}
                  options={[
                    { value: "available", label: "Wolny" },
                    { value: "busy", label: "Zajęty" },
                    { value: "off", label: "Dzień wolny" }
                  ]}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.push('/mechanics')}>
              Anuluj
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function MechanicFormPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>Ładowanie...</div>}>
      <MechanicForm />
    </Suspense>
  );
}
