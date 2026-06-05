'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDialog } from '@/contexts/DialogContext';
import { CustomSelect } from '@/components/CustomSelect';

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  companyName: string | null;
  vehicles: { id: number; brand: string; model: string; plate: string }[];
}

export default function TireStorageForm() {
  const router = useRouter();
  const { showAlert } = useDialog();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialCustomerId = searchParams?.get('customerId') || '';
  
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  useEffect(() => {
    fetch('/api/customers?limit=1000')
      .then(r => r.json())
      .then(data => setCustomers(Array.isArray(data) ? data : data.items || []))
      .catch(console.error);
  }, []);

  const selectedCustomer = customers.find(c => c.id.toString() === selectedCustomerId);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    let customerId = isNewCustomer ? null : parseInt(selectedCustomerId);
    let vehicleId = form.get('vehicleId') as string | null;

    try {
      if (isNewCustomer) {
        const customerRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: form.get('firstName'),
            lastName: form.get('lastName'),
            phone: form.get('phone'),
            vehicle: {
              brand: form.get('vehicleBrand'),
              model: form.get('vehicleModel'),
              plate: form.get('vehiclePlate')
            }
          })
        });
        
        if (!customerRes.ok) {
          await showAlert('Błąd podczas tworzenia klienta.');
          setLoading(false);
          return;
        }

        const newCustomer = await customerRes.json();
        customerId = newCustomer.id;
        if (newCustomer.vehicles && newCustomer.vehicles.length > 0) {
          vehicleId = newCustomer.vehicles[0].id.toString();
        }
      }

      if (!customerId) {
        await showAlert('Błąd: nie wybrano/utworzono klienta');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/tire-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId,
          vehicleId: vehicleId ? parseInt(vehicleId) : null,
          season: form.get('season'),
          type: form.get('type'),
          brandAndModel: form.get('brandAndModel'),
          size: form.get('size'),
          treadDepth: form.get('treadDepth'),
          storageLocation: form.get('storageLocation'),
          notes: form.get('notes')
        }),
      });

      if (res.ok) {
        const newRecord = await res.json();
        window.open(`/print-tire-storage/${newRecord.id}`, '_blank');
        router.push('/tire-storage');
      } else {
        await showAlert('Błąd podczas tworzenia depozytu.');
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
        <h1 className="page-title">Nowe przyjęcie do przechowalni</h1>
        <p className="page-subtitle">Przyjęcie opon lub kół</p>
      </div>

      <form onSubmit={handleCreate}>
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Dane klienta</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="radio" checked={!isNewCustomer} onChange={() => setIsNewCustomer(false)} /> Wybierz z listy
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="radio" checked={isNewCustomer} onChange={() => setIsNewCustomer(true)} /> Nowy klient
              </label>
            </div>

            {!isNewCustomer ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">Klient *</label>
                  <CustomSelect
                    name="customerId"
                    className="form-select"
                    searchable={true}
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required={!isNewCustomer}
                    options={[
                      { value: "", label: "Wybierz klienta..." },
                      ...customers.map((c) => ({ value: c.id.toString(), label: `${c.firstName} ${c.lastName} ${c.companyName ? `(${c.companyName})` : ''}` }))
                    ]}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pojazd</label>
                  <CustomSelect 
                    name="vehicleId" 
                    className="form-select" 
                    searchable={true}
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    disabled={!selectedCustomer}
                    options={[
                      { value: "", label: "Opcjonalnie pojazd..." },
                      ...(selectedCustomer?.vehicles.map((v) => ({ value: v.id.toString(), label: `${v.brand} ${v.model} — ${v.plate}` })) || [])
                    ]}
                  />
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Imię *</label>
                    <input type="text" className="form-input" name="firstName" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nazwisko *</label>
                    <input type="text" className="form-input" name="lastName" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon *</label>
                  <input type="text" className="form-input" name="phone" required />
                </div>
                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Marka (np. Honda) *</label>
                    <input type="text" className="form-input" name="vehicleBrand" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model (np. CBR) *</label>
                    <input type="text" className="form-input" name="vehicleModel" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nr rej. (opcjon.)</label>
                    <input type="text" className="form-input" name="vehiclePlate" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Szczegóły depozytu</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Co przyjmujemy? *</label>
                <select name="type" className="form-input" required>
                  <option value="Opony">Opony (bez felg)</option>
                  <option value="Koła">Koła (z felgami)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sezon *</label>
                <select name="season" className="form-input" required>
                  <option value="Zima">Zima</option>
                  <option value="Lato">Lato</option>
                  <option value="Wielosezonowe">Wielosezonowe</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Marka i model *</label>
                <input className="form-input" name="brandAndModel" required placeholder="np. Michelin Alpin 6" />
              </div>
              <div className="form-group">
                <label className="form-label">Rozmiar *</label>
                <input className="form-input" name="size" required placeholder="np. 205/55 R16" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Głębokość bieżnika / stan</label>
                <input className="form-input" name="treadDepth" placeholder="np. 6mm" />
              </div>
              <div className="form-group">
                <label className="form-label">Miejsce na magazynie</label>
                <input className="form-input" name="storageLocation" placeholder="np. Regał 2, Półka B" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Dodatkowe uwagi</label>
              <textarea className="form-input" name="notes" placeholder="np. uszkodzony wentyl, porysowana felga" rows={2} />
            </div>
          </div>
          
          <div style={{ marginTop: 'var(--space-xl)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()} disabled={loading}>
              Anuluj
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zapisz i drukuj protokół'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
