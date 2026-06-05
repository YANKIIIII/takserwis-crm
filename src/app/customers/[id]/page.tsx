'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CustomSelect } from '@/components/CustomSelect';
import { CustomMultiSelect } from '@/components/CustomMultiSelect';
import { useDialog } from '@/contexts/DialogContext';

interface WorkOrder {
  id: number;
  status: string;
  description: string | null;
  totalAmount: number;
  receivedAt: string;
  createdAt: string;
  mechanic?: { name: string } | null;
}

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number | null;
  vin: string | null;
  plate: string;
  mileage: number | null;
  workOrders?: WorkOrder[];
  estimates?: any[];
}

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  street: string | null;
  defaultVehicleId: number | null;
  paymentMethod: string | null;
  paymentTerm: string | null;
  discountServices: number | null;
  discountGoods: number | null;
  marketingConsent: boolean;
  notes: string | null;
  createdAt: string;
  vehicles: Vehicle[];
  sales?: any[];
  proformas?: any[];
  warehouse?: any[];
  calendarEvents?: any[];
  tireStorages?: any[];
  tags?: any[];
  tagIds?: number[];
}

const TABS = [
  'Dane klienta',
  'Pojazdy',
  'Zlecenia',
  'Wyceny',
  'Sprzedaż',
  'Pro forma',
  'Magazyn',
  'Rezerwacje',
  'Przechowalnia',
  'Historia SMS',
  'Historia e-mail'
];

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Oczekujące', className: 'badge-pending' },
  in_progress: { label: 'W trakcie', className: 'badge-in-progress' },
  done: { label: 'Zakończone', className: 'badge-done' },
};

export default function CustomerDetailPage() {
  const { showAlert, showConfirm } = useDialog();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Dane klienta');
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<any[]>([]);
  const [showTireModal, setShowTireModal] = useState(false);

  useEffect(() => {
    fetch('/api/tags?entity=customer_tag')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTags(data); })
      .catch(console.error);
  }, []);

  const loadCustomer = () => {
    fetch(`/api/customers/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setCustomer(data);
        setFormData(data);
        setLoading(false);
      })
      .catch(() => {
        router.push('/customers');
      });
  };

  useEffect(() => {
    loadCustomer();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'tagIds') {
        const tagId = parseInt(value);
        setFormData(prev => {
          const currentTags = prev.tags ? prev.tags.map((t: any) => t.id) : [];
          if (checked) {
            return { ...prev, tagIds: [...currentTags, tagId], tags: [...(prev.tags || []), { id: tagId }] };
          } else {
            return { ...prev, tagIds: currentTags.filter((id: number) => id !== tagId), tags: (prev.tags || []).filter((t: any) => t.id !== tagId) };
          }
        });
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        tagIds: formData.tags?.map((t: any) => t.id) || []
      };
      
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        setCustomer(updated);
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

  // handleCreateVehicle moved to /vehicles/form

  if (loading || !customer) {
    return <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>Ładowanie...</div>;
  }

  const allWorkOrders = (customer.vehicles || []).flatMap(v =>
    (v.workOrders || []).map(wo => ({ ...wo, vehicle: v }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const allEstimates = (customer.vehicles || []).flatMap(v =>
    (v.estimates || []).map((est: any) => ({ ...est, vehicle: v }))
  ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-2xl)' }}>
      {/* Breadcrumbs */}
      <div style={{ marginBottom: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <Link href="/customers" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Klienci</Link>
        {' > '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          {customer.firstName} {customer.lastName}
        </span>
      </div>

      <div className="page-header" style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 className="page-title">{customer.firstName} {customer.lastName}</h1>
      </div>

      {/* Tabs */}
      <div className="hide-scrollbar" style={{
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

      {/* Content */}
      <div>
        {activeTab === 'Dane klienta' && (
          <div className="card" style={{ padding: 'var(--space-xl)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">Imię</label>
                  <input className="form-input" name="firstName" value={formData.firstName || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Domyślny pojazd</label>
                  <CustomSelect
                    name="defaultVehicleId"
                    className="form-select"
                    value={formData.defaultVehicleId?.toString() || ''}
                    onChange={handleChange as any}
                    options={[
                      { value: "", label: "Brak domyślnego" },
                      ...(customer.vehicles || []).map(v => ({ value: v.id.toString(), label: `${v.brand} ${v.model} - ${v.plate}` }))
                    ]}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kod pocztowy</label>
                  <input className="form-input" name="postalCode" value={formData.postalCode || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Kraj</label>
                  <CustomSelect
                    name="country"
                    className="form-select"
                    value={formData.country || 'Polska'}
                    onChange={handleChange as any}
                    options={[
                      { value: "Polska", label: "Polska" },
                      { value: "Niemcy", label: "Niemcy" },
                      { value: "Inny", label: "Inny" }
                    ]}
                  />
                </div>
              </div>

              {/* Middle Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">Nazwisko</label>
                  <input className="form-input" name="lastName" value={formData.lastName || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Metoda płatności</label>
                  <CustomSelect
                    name="paymentMethod"
                    className="form-select"
                    value={formData.paymentMethod || ''}
                    onChange={handleChange as any}
                    options={[
                      { value: "", label: "Wybierz..." },
                      { value: "Gotówka", label: "Gotówka" },
                      { value: "Karta", label: "Karta płatnicza" },
                      { value: "Przelew", label: "Przelew bankowy" }
                    ]}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Miasto</label>
                  <input className="form-input" name="city" value={formData.city || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ulica</label>
                  <input className="form-input" name="street" value={formData.street || ''} onChange={handleChange} />
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">Termin płatności</label>
                  <CustomSelect
                    name="paymentTerm"
                    className="form-select"
                    value={formData.paymentTerm || ''}
                    onChange={handleChange as any}
                    options={[
                      { value: "", label: "Domyślny" },
                      { value: "7", label: "7 dni" },
                      { value: "14", label: "14 dni" },
                      { value: "30", label: "30 dni" }
                    ]}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Etykiety (Tagi)</label>
                  <CustomMultiSelect
                    options={tags.map(tag => ({ value: String(tag.id), label: tag.name, color: tag.color }))}
                    values={(formData.tags || []).map((t: any) => String(t.id))}
                    onChange={(newValues) => {
                      const newTags = tags.filter(t => newValues.includes(String(t.id)));
                      handleChange({ target: { name: 'tags', value: newTags } } as any);
                    }}
                    placeholder="-- Wybierz etykiety --"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">% rabat na usługi</label>
                  <input className="form-input" type="number" name="discountServices" value={formData.discountServices || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">% rabat na towary</label>
                  <input className="form-input" type="number" name="discountGoods" value={formData.discountGoods || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Numer telefonu</label>
                  <input className="form-input" name="phone" value={formData.phone || ''} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Bottom Full-width fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
              <div className="form-group" style={{ maxWidth: 400 }}>
                <label className="form-label">E-mail</label>
                <input className="form-input" type="email" name="email" value={formData.email || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Opis klienta</label>
                <textarea className="form-textarea" rows={3} name="notes" value={formData.notes || ''} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    name="marketingConsent"
                    checked={formData.marketingConsent || false}
                    onChange={handleChange}
                    style={{ marginRight: 8, width: 16, height: 16, accentColor: 'var(--primary-color)' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Zgoda na otrzymywanie treści marketingowych</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)' }}>
              <button className="btn btn-secondary" onClick={() => router.push('/customers')}>
                Anuluj
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          </div>
        )}

        {/* Pojazdy */}
        {activeTab === 'Pojazdy' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3>Pojazdy klienta</h3>
              <button className="btn btn-primary" onClick={() => router.push(`/vehicles/form?customerId=${id}`)}>+ Dodaj pojazd</button>
            </div>

            {customer.vehicles?.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Pojazd</th><th>Rejestracja</th><th>VIN</th><th>Przebieg</th></tr></thead>
                  <tbody>
                    {customer.vehicles.map(v => (
                      <tr key={v.id}>
                        <td>{v.brand} {v.model}</td>
                        <td>{v.plate}</td>
                        <td>{v.vin || '—'}</td>
                        <td>{v.mileage ? `${v.mileage} km` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                Brak pojazdów przypisanych do tego klienta.
              </div>
            )}
          </div>
        )}

        {/* Zlecenia */}
        {activeTab === 'Zlecenia' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3>Zlecenia klienta</h3>
              <Link href="/work-orders" className="btn btn-primary">+ Nowe zlecenie</Link>
            </div>

            {allWorkOrders.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Pojazd</th>
                      <th>Opis</th>
                      <th>Mechanik</th>
                      <th>Status</th>
                      <th>Data zlecenia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allWorkOrders.map(wo => {
                      const tag = tags.find(t => t.name === wo.status);
                      const customColor = tag?.color;
                      const st = statusLabels[wo.status] || { label: wo.status, className: 'badge-pending' };
                      return (
                        <tr key={wo.id} onClick={() => window.location.href = `/work-orders/${wo.id}`} style={{ cursor: 'pointer' }} className="table-row-hover">
                          <td style={{ fontWeight: 600 }}>{wo.vehicle.brand} {wo.vehicle.model} ({wo.vehicle.plate})</td>
                          <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {wo.description || '—'}
                          </td>
                          <td>{wo.mechanic?.name || 'Nieprzypisany'}</td>
                          <td>
                            {customColor ? (
                              <span className="badge" style={{ backgroundColor: `color-mix(in srgb, ${customColor} 15%, transparent)`, color: customColor, border: `1px solid color-mix(in srgb, ${customColor} 30%, transparent)` }}>
                                <span className="badge-dot" style={{ backgroundColor: customColor }} />
                                {wo.status}
                              </span>
                            ) : (
                              <span className={`badge ${st.className}`}>
                                <span className="badge-dot" />
                                {st.label}
                              </span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{new Date(wo.createdAt).toLocaleDateString('pl-PL')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                Brak zleceń przypisanych do tego klienta.
              </div>
            )}
          </div>
        )}

        {/* Wyceny */}
        {activeTab === 'Wyceny' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3>Wyceny klienta</h3>
              <button className="btn btn-primary" onClick={() => router.push(`/estimates/form?customerId=${id}`)}>+ Nowa wycena</button>
            </div>

            {allEstimates.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Pojazd</th>
                      <th>Opis</th>
                      <th>Kwota brutto</th>
                      <th>Ważna do</th>
                      <th>Status</th>
                      <th>Data utworzenia</th>
                      <th>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allEstimates.map((est: any) => {
                      return (
                        <tr key={est.id}>
                          <td style={{ fontWeight: 600 }}>#{est.id}</td>
                          <td>{est.vehicle.brand} {est.vehicle.model} ({est.vehicle.plate})</td>
                          <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {est.description || '—'}
                          </td>
                          <td style={{ fontWeight: 600 }}>{est.totalAmount?.toFixed(2)} PLN</td>
                          <td>{est.validUntil ? new Date(est.validUntil).toLocaleDateString('pl-PL') : '—'}</td>
                          <td>
                            <span className={`badge ${est.status === 'converted' ? 'badge-done' : est.status === 'accepted' ? 'badge-in-progress' : 'badge-pending'}`}>
                              <span className="badge-dot" />
                              {est.status === 'converted' ? 'Zlecenie utworzone' : est.status === 'accepted' ? 'Zaakceptowana' : est.status === 'rejected' ? 'Odrzucona' : 'Szkic'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{new Date(est.createdAt).toLocaleDateString('pl-PL')}</td>
                          <td>
                            {est.status !== 'converted' && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/estimates/${est.id}/convert`, { method: 'POST' });
                                    if (res.ok) {
                                      const data = await res.json();
                                      await showAlert('Wycena została pomyślnie zamieniona w zlecenie!');
                                      router.push(`/work-orders`);
                                    } else {
                                      await showAlert('Błąd podczas konwersji.');
                                    }
                                  } catch (e) {
                                    await showAlert('Wystąpił błąd.');
                                  }
                                }}
                              >
                                Utwórz zlecenie
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                Brak wycen dla tego klienta.
              </div>
            )}
          </div>
        )}

        {/* Sprzedaż */}
        {activeTab === 'Sprzedaż' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3>Dokumenty sprzedaży</h3>
            </div>

            {customer.sales && customer.sales.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Typ</th><th>Nr dokumentu</th><th>Pozycje</th><th>Kwota</th><th>Status</th><th>Data</th></tr></thead>
                  <tbody>
                    {customer.sales.map((inv: any) => {
                      const statusMap: Record<string, { label: string, cls: string }> = {
                        draft: { label: 'Szkic', cls: 'badge-pending' },
                        sent: { label: 'Wysłany', cls: 'badge-in-progress' },
                        paid: { label: 'Opłacony', cls: 'badge-done' },
                        overdue: { label: 'Zaległe', cls: '' },
                      };
                      const s = statusMap[inv.status] || { label: inv.status, cls: '' };
                      const dateStr = inv.date ? new Date(inv.date).toISOString().split('T')[0] : '';
                      const itemsStr = inv._count?.items ? `${inv._count.items} poz.` : 'Brak pozycji';
                      const typeLabel = inv.type === 'FV' ? 'Faktura' : inv.type === 'PA' ? 'Paragon' : inv.type;

                      return (
                        <tr key={inv.id}>
                          <td><span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{typeLabel}</span></td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>{inv.documentNumber}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{itemsStr}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary-color)' }}>{inv.totalValue.toLocaleString('pl-PL')} zł</td>
                          <td>
                            <span className={`badge ${s.cls}`} style={inv.status === 'overdue' ? { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' } : {}}>
                              <span className="badge-dot" />
                              {s.label}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{dateStr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                Brak dokumentów sprzedaży dla tego klienta.
              </div>
            )}
          </div>
        )}

        {activeTab === 'Pro forma' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3>Pro formy</h3>
              <Link href={`/warehouse/new?type=PROFORMA&contractor=${encodeURIComponent((customer.firstName + ' ' + customer.lastName).trim())}`} className="btn btn-primary">+ Nowa Pro forma</Link>
            </div>

            {customer.proformas && customer.proformas.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Typ</th><th>Nr dokumentu</th><th>Kwota</th><th>Data</th><th>Akcje</th></tr></thead>
                  <tbody>
                    {customer.proformas.map((doc: any) => (
                      <tr key={doc.id}>
                        <td><span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>Pro forma</span></td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>{doc.documentNumber}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{doc.totalValue.toLocaleString('pl-PL')} zł</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(doc.date).toISOString().split('T')[0]}</td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => window.open(`/print-sales/${doc.id}`, '_blank')}>Drukuj</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                Brak wystawionych pro form.
              </div>
            )}
          </div>
        )}

        {activeTab === 'Magazyn' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3>Dokumenty Wydania Zewnętrznego (WZ)</h3>
              <Link href={`/warehouse/new?type=WZ&contractor=${encodeURIComponent((customer.firstName + ' ' + customer.lastName).trim())}`} className="btn btn-primary">+ Nowe WZ</Link>
            </div>

            {customer.warehouse && customer.warehouse.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Typ</th><th>Nr dokumentu</th><th>Pozycje</th><th>Kwota</th><th>Data</th><th>Akcje</th></tr></thead>
                  <tbody>
                    {customer.warehouse.map((doc: any) => (
                      <tr key={doc.id}>
                        <td><span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>WZ</span></td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>{doc.documentNumber}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{doc.items ? doc.items.length : 0} poz.</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{doc.totalValue.toLocaleString('pl-PL')} zł</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(doc.date).toISOString().split('T')[0]}</td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => window.open(`/print-sales/${doc.id}`, '_blank')}>Drukuj</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                Brak dokumentów WZ dla tego klienta.
              </div>
            )}
          </div>
        )}

        {activeTab === 'Rezerwacje' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3>Nadchodzące wizyty (Rezerwacje)</h3>
              {/* Temporarily pointing to calendar, maybe pass ?customer=... later */}
              <Link href="/calendar" className="btn btn-primary">+ Nowa rezerwacja</Link>
            </div>

            {customer.calendarEvents && customer.calendarEvents.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Tytuł wizyty</th><th>Data</th><th>Godzina</th><th>Mechanik</th></tr></thead>
                  <tbody>
                    {customer.calendarEvents.sort((a: any, b: any) => new Date(`${b.date}T${b.hour}`).getTime() - new Date(`${a.date}T${a.hour}`).getTime()).map((ev: any) => (
                      <tr key={ev.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: ev.color }}></span>
                            {ev.title}
                          </div>
                        </td>
                        <td>{new Date(ev.date).toLocaleDateString('pl-PL')}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{ev.hour}</td>
                        <td>{ev.mechanic || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                Brak zapisanych wizyt w kalendarzu.
              </div>
            )}
          </div>
        )}

        {activeTab === 'Przechowalnia' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3>Przechowalnia opon i kół</h3>
              <button className="btn btn-primary" onClick={() => setShowTireModal(true)}>+ Dodaj do przechowalni</button>
            </div>

            {customer.tireStorages && customer.tireStorages.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Status</th><th>Typ / Sezon</th><th>Marka i Model</th><th>Rozmiar</th><th>Miejsce</th><th>Data</th><th>Akcje</th></tr></thead>
                  <tbody>
                    {customer.tireStorages.map((ts: any) => (
                      <tr key={ts.id}>
                        <td>
                          <span className={`badge ${ts.status === 'W magazynie' ? 'badge-in-progress' : 'badge-done'}`}>
                            <span className="badge-dot" />
                            {ts.status}
                          </span>
                        </td>
                        <td>{ts.type} ({ts.season})</td>
                        <td style={{ fontWeight: 600 }}>{ts.brandAndModel}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{ts.size}</td>
                        <td>{ts.storageLocation || '—'}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(ts.depositDate).toLocaleDateString('pl-PL')}</td>
                        <td>
                          {ts.status === 'W magazynie' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ marginRight: '8px' }}
                              onClick={async () => {
                                const confirmed = await showConfirm('Czy na pewno wydać opony klientowi?');
                                if (!confirmed) return;
                                const res = await fetch(`/api/tire-storage/${ts.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'Wydane' })
                                });
                                if (res.ok) {
                                  loadCustomer();
                                  window.open(`/print-tire-storage/${ts.id}`, '_blank');
                                } else {
                                  alert('Wystąpił błąd podczas wydawania opon.');
                                }
                              }}
                            >
                              Wydaj
                            </button>
                          )}
                          <button className="btn btn-secondary btn-sm" onClick={() => window.open(`/print-tire-storage/${ts.id}`, '_blank')}>Drukuj</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                Brak opon w przechowalni dla tego klienta.
              </div>
            )}
          </div>
        )}

        {/* Generic Placeholders for active tabs */}
        {activeTab !== 'Dane klienta' && activeTab !== 'Pojazdy' && activeTab !== 'Zlecenia' && activeTab !== 'Wyceny' && activeTab !== 'Sprzedaż' && activeTab !== 'Pro forma' && activeTab !== 'Magazyn' && activeTab !== 'Rezerwacje' && activeTab !== 'Przechowalnia' && (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
            <h3 style={{ marginBottom: 'var(--space-md)' }}>{activeTab}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
              Ta sekcja jest w trakcie budowy.
            </p>
          </div>
        )}
      </div>

      {/* ── Add Tire Storage Modal ── */}
      {showTireModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowTireModal(false); }}>
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Przyjęcie do przechowalni</h2>
              <button className="modal-close" type="button" onClick={() => setShowTireModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const res = await fetch('/api/tire-storage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customerId: customer.id,
                  vehicleId: form.get('vehicleId') || null,
                  season: form.get('season'),
                  type: form.get('type'),
                  brandAndModel: form.get('brandAndModel'),
                  size: form.get('size'),
                  treadDepth: form.get('treadDepth'),
                  storageLocation: form.get('storageLocation'),
                  notes: form.get('notes')
                })
              });
              if (res.ok) {
                setShowTireModal(false);
                loadCustomer();
                // Optionally open print dialog immediately
                const newRecord = await res.json();
                window.open(`/print-tire-storage/${newRecord.id}`, '_blank');
              } else {
                alert('Błąd dodawania zapisu');
              }
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">Pojazd (opcjonalnie)</label>
                  <select name="vehicleId" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    <option value="">-- Wybierz pojazd --</option>
                    {(customer.vehicles || []).map((v: any) => (
                      <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Co przyjmujemy? *</label>
                    <select name="type" className="form-input" required style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      <option value="Opony">Opony (bez felg)</option>
                      <option value="Koła">Koła (z felgami)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Sezon *</label>
                    <select name="season" className="form-input" required style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      <option value="Zima">Zima</option>
                      <option value="Lato">Lato</option>
                      <option value="Wielosezonowe">Wielosezonowe</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Marka i model *</label>
                    <input className="form-input" name="brandAndModel" required placeholder="np. Michelin Alpin 6" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Rozmiar *</label>
                    <input className="form-input" name="size" required placeholder="np. 205/55 R16" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Głębokość bieżnika / stan</label>
                    <input className="form-input" name="treadDepth" placeholder="np. 6mm" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Miejsce na magazynie</label>
                    <input className="form-input" name="storageLocation" placeholder="np. Regał 2, Półka B" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Dodatkowe uwagi</label>
                  <textarea className="form-input" name="notes" placeholder="np. uszkodzony wentyl, porysowana felga" rows={2} />
                </div>

                <div className="modal-actions" style={{ marginTop: 'var(--space-md)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTireModal(false)}>Anuluj</button>
                  <button type="submit" className="btn btn-primary">Dodaj i Drukuj Protokół</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
