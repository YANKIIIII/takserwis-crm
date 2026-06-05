'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useDialog } from '@/contexts/DialogContext';
import { CustomSelect } from '@/components/CustomSelect';

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  vehicles: { id: number; brand: string; model: string; plate: string }[];
}

interface Mechanic {
  id: number;
  name: string;
  specialization: string | null;
  status: string;
}

function WorkOrderForm() {
  const router = useRouter();
  const { showAlert } = useDialog();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedMechanicId, setSelectedMechanicId] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/customers'),
      fetch('/api/mechanics'),
    ])
    .then(async ([custsRes, mechsRes]) => {
      setCustomers(await custsRes.json());
      setMechanics(await mechsRes.json());
    })
    .catch(console.error);
  }, []);

  const selectedCustomer = customers.find(c => c.id.toString() === selectedCustomerId);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
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
        const newCustomer = await customerRes.json();
        if (newCustomer.vehicles && newCustomer.vehicles.length > 0) {
          vehicleId = newCustomer.vehicles[0].id.toString();
        }
      }

      if (!vehicleId) {
        await showAlert('Błąd: nie wybrano/utworzono pojazdu');
        setLoading(false);
        return;
      }

      // Fetch columns to set initial status
      const tagsRes = await fetch('/api/tags?entity=work_order_status');
      const tags = await tagsRes.json();
      const status = tags && tags.length > 0 ? tags[0].name : 'pending';

      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicleId,
          mechanicId: form.get('mechanicId') || null,
          description: form.get('description'),
          status: status,
          returnParts: form.get('returnParts') === 'on',
          testDrive: form.get('testDrive') === 'on',
          registrationCert: form.get('registrationCert') === 'on',
          fillFluids: form.get('fillFluids') === 'on',
          fillLights: form.get('fillLights') === 'on',
        }),
      });

      if (res.ok) {
        router.push('/work-orders');
      } else {
        await showAlert('Błąd podczas tworzenia zlecenia.');
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
        <h1 className="page-title">Nowe zlecenie</h1>
        <p className="page-subtitle">Tworzenie zlecenia naprawy</p>
      </div>

      <form onSubmit={handleCreate}>
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Szczegóły zlecenia</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
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
                      ...customers.map((c) => ({ value: c.id.toString(), label: `${c.firstName} ${c.lastName}` }))
                    ]}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pojazd *</label>
                  <CustomSelect 
                    name="vehicleId" 
                    className="form-select" 
                    searchable={true}
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    required={!isNewCustomer}
                    disabled={!selectedCustomer}
                    options={[
                      { value: "", label: "Wybierz pojazd..." },
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
                    <label className="form-label">Rejestracja *</label>
                    <input type="text" className="form-input" name="vehiclePlate" required />
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Mechanik</label>
              <CustomSelect 
                name="mechanicId" 
                className="form-select"
                value={selectedMechanicId}
                onChange={(e) => setSelectedMechanicId(e.target.value)}
                options={[
                  { value: "", label: "Nie przypisany" },
                  ...mechanics.filter(m => m.status !== 'off').map((m) => ({ 
                    value: m.id.toString(), 
                    label: `${m.name} (${m.specialization || 'Uniwersalny'}) — ${m.status === 'available' ? 'Wolny' : 'Zajęty'}` 
                  }))
                ]}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Opis prac</label>
              <textarea className="form-textarea" name="description" placeholder="Wymiana oleju, diagnostyka silnika..." rows={4} />
            </div>

            <div className="form-group" style={{ marginTop: '5px' }}>
              <label className="form-label" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>Dodatkowe informacje (druk)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="returnParts" /> Zwrot części
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="testDrive" /> Jazda testowa
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="registrationCert" /> Dowód rejestracyjny
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="fillFluids" /> Uzupełnić płyny
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="fillLights" /> Uzupełnić oświetlenie
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.push('/work-orders')}>
              Anuluj
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Utwórz zlecenie'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function WorkOrderFormPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>Ładowanie...</div>}>
      <WorkOrderForm />
    </Suspense>
  );
}
