'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CustomSelect } from '@/components/CustomSelect';
import { useDialog } from '@/contexts/DialogContext';

const TABS = [
  'Dane pojazdu',
  'Pliki',
  'Historia zleceń',
  'Historia zadań',
  'Przebiegi',
  'Dane naprawcze'
];

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Oczekujące', className: 'badge-pending' },
  in_progress: { label: 'W trakcie', className: 'badge-in-progress' },
  done: { label: 'Zakończone', className: 'badge-done' },
};

interface Mechanic {
  id: number;
  name: string;
}

interface WorkOrder {
  id: number;
  status: string;
  description: string | null;
  totalAmount: number;
  receivedAt: string;
  createdAt: string;
  mechanic?: Mechanic | null;
}

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
}

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number | null;
  vin: string | null;
  plate: string;
  mileage: number | null;
  mileageUnit: string | null;
  color: string | null;
  capacity: number | null;
  fuelType: string | null;
  engineNumber: string | null;
  enginePower: number | null;
  description: string | null;
  aztecCode: string | null;
  registrationDate: string | null;
  customer?: Customer;
  workOrders?: WorkOrder[];
}

export default function VehicleDetailPage() {
  const { showAlert } = useDialog();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [activeTab, setActiveTab] = useState('Dane pojazdu');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<Partial<Vehicle>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/vehicles/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setVehicle(data);
        setFormData(data);
        setLoading(false);
      })
      .catch(() => {
        router.push('/vehicles');
      });
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const updated = await res.json();
        setVehicle(updated);
        setFormData(updated);
        await showAlert('Zapisano pomyślnie!');
      } else {
        await showAlert('Błąd podczas zapisywania');
      }
    } catch (e) {
      await showAlert('Wystąpił błąd');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !vehicle) {
    return <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>Ładowanie...</div>;
  }

  const customerName = vehicle.customer 
    ? `${vehicle.customer.firstName} ${vehicle.customer.lastName}` 
    : 'Brak właściciela';

  // Dummy tasks and workorders fallback for design completion
  const workOrders = vehicle.workOrders || [];
  
  const tasks = [
    {
      id: 'ZL 110/05/2026',
      mileage: `${vehicle.mileage || 0} km`,
      name: 'Ustawienie geometrii kół',
      mechanic: 'MK',
      planned: '',
      estimatedTime: '0.72h',
      actualTime: '0.00h',
      cost: '180.00',
      status: 'done'
    }
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-2xl)' }}>
      {/* Breadcrumbs */}
      <div style={{ marginBottom: 'var(--space-lg)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <Link href="/vehicles" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Pojazdy</Link>
        {' > '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          {vehicle.brand} {vehicle.model} {vehicle.plate}
        </span>
      </div>

      {/* Folder-style Tabs container */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border)', 
        overflowX: 'auto',
        marginBottom: 'var(--space-xl)' 
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab;
          return (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                cursor: 'pointer',
                padding: '12px 24px',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--orange)' : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab}
            </div>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div>
        
        {/* Dane pojazdu */}
        {activeTab === 'Dane pojazdu' && (
          <div className="card" style={{ padding: 'var(--space-xl)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-xl)' }}>
              
              {/* Kolumna 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kod Aztec</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                    </button>
                    <input className="form-input" name="aztecCode" value={formData.aztecCode || ''} onChange={handleChange} placeholder="AZTEC" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Marka</label>
                  <input className="form-input" name="brand" value={formData.brand || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Model</label>
                  <input className="form-input" name="model" value={formData.model || ''} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rok produkcji</label>
                  <input className="form-input" name="year" type="number" value={formData.year || ''} onChange={handleChange} />
                </div>
              </div>

              {/* Kolumna 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Numer rejestracyjny</label>
                  <div style={{ display: 'flex' }}>
                    <input className="form-input" name="plate" value={formData.plate || ''} onChange={handleChange} style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }} />
                    <button className="btn btn-primary" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0 10px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Numer VIN</label>
                  <div style={{ display: 'flex' }}>
                    <input className="form-input" name="vin" value={formData.vin || ''} onChange={handleChange} style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }} />
                    <button className="btn btn-primary" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0 10px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Data pierwszej rejestracji</label>
                  <input className="form-input" type="date" name="registrationDate" 
                    value={formData.registrationDate ? new Date(formData.registrationDate).toISOString().split('T')[0] : ''} 
                    onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kolor</label>
                  <input className="form-input" name="color" value={formData.color || ''} onChange={handleChange} placeholder="Kolor" />
                </div>
              </div>

              {/* Kolumna 3 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pojemność</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input className="form-input" type="number" name="capacity" value={formData.capacity || ''} onChange={handleChange} style={{ borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0 }} />
                      <span style={{ padding: '6px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderTopRightRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>cm³</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Moc silnika</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input className="form-input" type="number" name="enginePower" value={formData.enginePower || ''} onChange={handleChange} style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }} />
                      <button className="btn btn-secondary" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '6px 10px', fontSize: '0.85rem' }}>kW</button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rodzaj paliwa</label>
                    <CustomSelect 
                      name="fuelType"
                      className="form-select" 
                      value={formData.fuelType || ''} 
                      onChange={handleChange as any}
                      options={[
                        { value: "", label: "Wybierz..." },
                        { value: "Benzyna", label: "Benzyna" },
                        { value: "Diesel", label: "Diesel" },
                        { value: "LPG", label: "LPG" },
                        { value: "Elektryczny", label: "Elektryczny" },
                        { value: "Hybryda", label: "Hybryda" }
                      ]}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Numer silnika</label>
                    <input className="form-input" name="engineNumber" value={formData.engineNumber || ''} onChange={handleChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Jednostka przebiegu</label>
                  <CustomSelect 
                    name="mileageUnit"
                    className="form-select" 
                    value={formData.mileageUnit || 'km'} 
                    onChange={handleChange as any}
                    options={[
                      { value: "km", label: "km" },
                      { value: "mi", label: "mi" },
                      { value: "mth", label: "mth" }
                    ]}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aktualny właściciel</label>
                  <CustomSelect 
                    name="owner"
                    className="form-select" 
                    value="owner"
                    onChange={() => {}}
                    disabled
                    options={[
                      { value: "owner", label: customerName }
                    ]}
                  />
                </div>
              </div>

            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-xl)' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Opis pojazdu</label>
              <textarea className="form-textarea" rows={4} name="description" value={formData.description || ''} onChange={handleChange} placeholder="Opis pojazdu"></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
              <button className="btn btn-secondary" onClick={() => router.push('/vehicles')} disabled={saving}>Anuluj</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          </div>
        )}

        {/* Pliki */}
        {activeTab === 'Pliki' && (
          <div className="card" style={{ padding: 'var(--space-xl)' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--space-xl)' }}>
              Pliki pojazdu
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <button style={{ 
                background: '#e0e7ff', 
                color: '#4f46e5', 
                border: 'none', 
                padding: '12px 24px', 
                borderRadius: 'var(--radius-md)',
                fontWeight: 500,
                cursor: 'pointer'
              }}>
                Brak plików, kliknij aby dodać
              </button>
            </div>
          </div>
        )}

        {/* Historia zleceń */}
        {activeTab === 'Historia zleceń' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>+ Nowe zlecenie</button>
                <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', background: '#fee2e2', border: 'none' }}>Usuń zaznaczone</button>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 12px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input style={{ border: 'none', outline: 'none', padding: '6px', fontSize: '0.9rem', width: '200px' }} placeholder="Szukaj" />
                </div>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px', width: '40px' }}><input type="checkbox" /></th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>NUMER ZLECENIA</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>UTWORZONE</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>ZAKOŃCZONE</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>STATUS</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>KLIENT</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>PRZYJĘCIE</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>RAZEM</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map((wo, i) => {
                    const st = statusLabels[wo.status] || statusLabels.pending;
                    return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '12px' }}><input type="checkbox" /></td>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{wo.id}</td>
                      <td style={{ padding: '12px' }}>{new Date(wo.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}>—</td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge ${st.className}`}>
                          <span className="badge-dot" />
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{customerName}</td>
                      <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        {wo.receivedAt ? new Date(wo.receivedAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{wo.totalAmount}</td>
                    </tr>
                    );
                  })}
                  {workOrders.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Brak zleceń dla tego pojazdu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Ustawienia tabeli</button>
                <CustomSelect 
                  name="itemsPerPage"
                  className="form-select" 
                  value="100"
                  onChange={() => {}}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}
                  options={[
                    { value: "100", label: "100" }
                  ]}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Od 1 do {workOrders.length} z {workOrders.length} wyników</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button style={{ background: 'var(--text-secondary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>1</button>
              </div>
            </div>
          </div>
        )}

        {/* Historia zadań */}
        {activeTab === 'Historia zadań' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 12px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input style={{ border: 'none', outline: 'none', padding: '6px', fontSize: '0.9rem', width: '200px' }} placeholder="Szukaj" />
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>ZADANIE</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>PRACOWNIK</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>PLANOWANA DATA</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>SZAC. CZAS</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>CZAS</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>KOSZT USŁ.</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>STAT...</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                          {task.id} Przebieg: {task.mileage}
                        </div>
                        <div style={{ fontWeight: 500 }}>{task.name}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600 }}>
                          {task.mechanic}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>{task.planned}</td>
                      <td style={{ padding: '12px' }}>{task.estimatedTime}</td>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{task.actualTime}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{task.cost}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ background: '#dcfce7', color: '#16a34a', width: '24px', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CustomSelect 
                  name="taskItemsPerPage"
                  className="form-select" 
                  value="100"
                  onChange={() => {}}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}
                  options={[
                    { value: "100", label: "100" }
                  ]}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Od 1 do 1 z 1 wyników</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button style={{ background: 'var(--text-secondary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>1</button>
              </div>
            </div>
          </div>
        )}

        {/* Przebiegi */}
        {activeTab === 'Przebiegi' && (
          <div className="card" style={{ padding: 'var(--space-xl)' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Przebieg pojazdu
              </span>
              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                + Dodaj przebieg
              </button>
            </div>
            <div style={{ border: '1px solid var(--border)', borderTop: 'none', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              {/* Dummy Chart container */}
              <div style={{ width: '100%', height: '300px', borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                {/* Y-axis labels */}
                <div style={{ position: 'absolute', left: '-60px', top: '0', bottom: '0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', width: '50px' }}>
                  <span>200000 -</span>
                  <span>150000 -</span>
                  <span>100000 -</span>
                  <span>50000 -</span>
                  <span>0 -</span>
                </div>
                
                {/* Horizontal lines */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: '0', borderTop: '1px solid var(--border)' }}></div>
                <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', borderTop: '1px solid var(--border)' }}></div>
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px solid var(--border)' }}></div>
                <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', borderTop: '1px solid var(--border)' }}></div>

                {/* Vertical line and data point */}
                <div style={{ position: 'absolute', left: '50%', top: '0', bottom: '0', borderLeft: '1px dashed #d1d5db' }}></div>
                <div style={{ 
                  position: 'absolute', 
                  left: '50%', 
                  top: '1%', 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  border: '2px solid #8b5cf6', 
                  background: '#fff',
                  transform: 'translate(-50%, -50%)'
                }}></div>
                <div style={{ position: 'absolute', left: '50%', bottom: '-25px', transform: 'translateX(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date().toISOString().split('T')[0]}
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '40px', fontSize: '0.8rem', color: '#8b5cf6' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><line x1="3" y1="12" x2="9" y2="12"></line><line x1="15" y1="12" x2="21" y2="12"></line></svg>
                Przebieg
              </div>

            </div>
          </div>
        )}

        {/* Dane naprawcze (Empty Placeholder) */}
        {activeTab === 'Dane naprawcze' && (
          <div className="card" style={{ padding: 'var(--space-3xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
            Dane naprawcze niedostępne.
          </div>
        )}

      </div>
    </div>
  );
}
