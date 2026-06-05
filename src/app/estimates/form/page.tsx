'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDialog } from '@/contexts/DialogContext';
import { CustomSelect } from '@/components/CustomSelect';

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  vehicles: { id: number; brand: string; model: string; plate: string }[];
}

interface EstimateItem {
  id?: number;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  type: string;
}

function EstimateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useDialog();

  const customerIdParam = searchParams.get('customerId');

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerIdParam || '');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  
  const [description, setDescription] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<EstimateItem[]>([
    { name: '', quantity: 1, unitPrice: 0, discount: 0, type: 'service' }
  ]);

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(setCustomers)
      .catch(console.error);
  }, []);

  const selectedCustomer = customers.find(c => c.id.toString() === selectedCustomerId);

  // Auto-select first vehicle if customer changes and has only 1
  useEffect(() => {
    if (selectedCustomer && selectedCustomer.vehicles.length > 0) {
      if (!selectedCustomer.vehicles.find(v => v.id.toString() === selectedVehicleId)) {
        setSelectedVehicleId(selectedCustomer.vehicles[0].id.toString());
      }
    } else {
      setSelectedVehicleId('');
    }
  }, [selectedCustomer]);

  const totalAmount = items.reduce((sum, item) => {
    const itemTotal = (item.quantity * item.unitPrice) * (1 - item.discount / 100);
    return sum + itemTotal;
  }, 0);

  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 1, unitPrice: 0, discount: 0, type: 'part' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof EstimateItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      await showAlert('Wybierz pojazd.');
      return;
    }

    // Validate items
    const validItems = items.filter(i => i.name.trim() !== '');
    if (validItems.length === 0) {
      await showAlert('Dodaj przynajmniej jedną pozycję (usługę lub część).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          description,
          validUntil,
          totalAmount,
          items: validItems,
          status: 'draft'
        })
      });

      if (res.ok) {
        if (selectedCustomerId) {
          router.push(`/customers/${selectedCustomerId}`);
        } else {
          // If created directly, we can go to customers or work-orders
          router.push('/customers'); 
        }
      } else {
        await showAlert('Błąd podczas zapisywania wyceny.');
      }
    } catch (err) {
      console.error(err);
      await showAlert('Wystąpił błąd.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 className="page-title">Nowa wycena</h1>
        <p className="page-subtitle">Tworzenie wstępnego kosztorysu naprawy</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Dane podstawowe</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Klient *</label>
              <CustomSelect
                name="customerId"
                className="form-select"
                searchable={true}
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
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
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
                disabled={!selectedCustomer}
                options={[
                  { value: "", label: "Wybierz pojazd..." },
                  ...(selectedCustomer?.vehicles.map((v) => ({ value: v.id.toString(), label: `${v.brand} ${v.model} — ${v.plate}` })) || [])
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Ważna do</label>
              <input 
                type="date" 
                className="form-input" 
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
            <label className="form-label">Krótki opis / Uwagi dla klienta</label>
            <textarea 
              className="form-textarea" 
              rows={3} 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="np. Wycena przeglądu i wymiany rozrządu..."
            />
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Pozycje wyceny</h2>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}>
              + Dodaj pozycję
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {items.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 100px 120px 100px 40px', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Nazwa części/usługi" 
                  value={item.name}
                  onChange={e => handleItemChange(index, 'name', e.target.value)}
                  required
                />
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Ilość" 
                  min="0.1" step="0.1"
                  value={item.quantity || ''}
                  onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))}
                  required
                />
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Cena jd." 
                    min="0" step="0.01"
                    value={item.unitPrice || ''}
                    onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                    required
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Rabat %" 
                    min="0" max="100"
                    value={item.discount || ''}
                    onChange={e => handleItemChange(index, 'discount', Number(e.target.value))}
                  />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>%</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => handleRemoveItem(index)}
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-hover)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--danger-color)' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
              Suma brutto: <span style={{ color: 'var(--primary-color)' }}>{totalAmount.toFixed(2)} PLN</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
            Anuluj
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Zapisywanie...' : 'Zapisz wycenę'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EstimateFormPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>Ładowanie...</div>}>
      <EstimateForm />
    </Suspense>
  );
}
