'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { IconX, IconTrash } from '@/components/Icons';
import { CustomSelect } from '@/components/CustomSelect';

interface OrderItem {
  id: number;
  name: string;
  type: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface WorkOrderDetail {
  id: number;
  status: string;
  description: string | null;
  totalAmount: number;
  createdAt: string;
  completedAt: string | null;
  vehicle: {
    id: number;
    brand: string;
    model: string;
    plate: string;
    vin: string | null;
    mileage: number | null;
    customer: { id: number; firstName: string; lastName: string; phone: string; tags?: { id: number; name: string; color: string }[] };
  };
  mechanic: { name: string; specialization: string | null } | null;
  items: OrderItem[];
  returnParts: boolean;
  testDrive: boolean;
  registrationCert: boolean;
  fillFluids: boolean;
  fillLights: boolean;
  warehouseDocs?: any[];
  tags?: { id: number; name: string; color: string }[];
}

// statusMap removed, using dynamic columns from tags instead

export default function WorkOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<WorkOrderDetail | null>(null);
  const [mechanics, setMechanics] = useState<{id: number, name: string, specialization: string | null}[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [workOrderTags, setWorkOrderTags] = useState<any[]>([]);
  
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const [itemType, setItemType] = useState('service');
  const [selectedInvId, setSelectedInvId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  const [showPrintMenu, setShowPrintMenu] = useState(false);

  const loadOrder = useCallback(() => {
    fetch(`/api/work-orders/${id}?t=${Date.now()}`)
      .then((r) => r.json())
      .then(setOrder);
  }, [id]);

  useEffect(() => {
    loadOrder();
    fetch('/api/mechanics').then(r => r.json()).then(setMechanics);
    fetch('/api/inventory').then(r => r.json()).then(setInventoryItems);
    fetch('/api/tags?entity=work_order_status').then(r => r.json()).then(setColumns);
    fetch('/api/tags?entity=work_order_tag').then(r => r.json()).then(setWorkOrderTags);
  }, [loadOrder]);

  const addItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch('/api/order-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workOrderId: id,
        name: itemName,
        type: itemType,
        quantity: form.get('quantity'),
        unitPrice: itemPrice,
        inventoryItemId: itemType === 'part' && selectedInvId ? selectedInvId : undefined,
      }),
    });
    setShowAddItem(false);
    setItemName('');
    setItemPrice('');
    setSelectedInvId('');
    loadOrder();
  };

  const removeItem = async (itemId: number) => {
    await fetch(`/api/order-items?id=${itemId}`, { method: 'DELETE' });
    setItemToDelete(null);
    loadOrder();
  };

  const updateStatus = async (newStatus: string) => {
    await fetch(`/api/work-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    loadOrder();
  };

  const toggleTag = async (tagId: number) => {
    if (!order) return;
    const currentTags = order.tags || [];
    const hasTag = currentTags.some(t => t.id === tagId);
    let newTagIds;
    if (hasTag) {
      newTagIds = currentTags.filter(t => t.id !== tagId).map(t => t.id);
    } else {
      newTagIds = [...currentTags.map(t => t.id), tagId];
    }

    await fetch(`/api/work-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagIds: newTagIds }),
    });
    loadOrder();
  };

  if (!order || columns.length === 0) {
    return (
      <div style={{ padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>Ładowanie...</div>
    );
  }

  const currentColIndex = columns.findIndex(c => c.name === order.status);
  const col = currentColIndex !== -1 ? columns[currentColIndex] : { name: order.status, color: 'var(--secondary)' };
  
  const nextCol = currentColIndex >= 0 && currentColIndex < columns.length - 1 ? columns[currentColIndex + 1] : null;
  const prevCol = currentColIndex > 0 ? columns[currentColIndex - 1] : null;
  const serviceItems = order.items.filter((i) => i.type === 'service');
  const partItems = order.items.filter((i) => i.type === 'part');

  const DropdownItem = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <a href={href} target="_blank" style={{ padding: '8px 12px', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.85rem', borderRadius: '4px', display: 'block' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-body)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => setShowPrintMenu(false)}>
      {children}
    </a>
  );

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div style={{ marginBottom: 'var(--space-md)', fontSize: '0.78rem' }}>
        <Link href="/work-orders" style={{ color: 'var(--text-muted)' }}>← Zlecenia</Link>
      </div>

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            Zlecenie {`ZL${order.id}/${(new Date(order.createdAt).getMonth() + 1).toString().padStart(2, '0')}/${new Date(order.createdAt).getFullYear()}`}
            <span 
              className="badge" 
              style={{ 
                color: col.color, 
                borderColor: `${col.color}44`, 
                backgroundColor: `${col.color}15` 
              }}
            >
              <span className="badge-dot" style={{ backgroundColor: col.color }} />
              {col.name}
            </span>
          </h1>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            {order.tags?.map(tag => (
              <span key={tag.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 10px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 600,
                backgroundColor: `${tag.color}15`, color: tag.color, border: `1px solid ${tag.color}30`,
                boxShadow: `0 1px 2px ${tag.color}10`
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: tag.color }}></span>
                {tag.name}
                <button onClick={() => toggleTag(tag.id)} style={{ background: 'none', border: 'none', color: tag.color, cursor: 'pointer', marginLeft: '2px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconX size={12} />
                </button>
              </span>
            ))}
            
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowTagMenu(!showTagMenu)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '100px', height: 'auto' }}>
                + Etykieta
              </button>
              {showTagMenu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowTagMenu(false)} />
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 100, minWidth: '180px', padding: '4px' }}>
                    {workOrderTags.map(tag => {
                      const isActive = order.tags?.some(t => t.id === tag.id);
                      return (
                        <button key={tag.id} onClick={() => { toggleTag(tag.id); setShowTagMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 12px', background: isActive ? 'var(--bg-body)' : 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary)', borderRadius: '4px' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-body)'} onMouseLeave={e => e.currentTarget.style.background = isActive ? 'var(--bg-body)' : 'transparent'}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tag.color }}></span>
                          {tag.name}
                          {isActive && <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>✓</span>}
                        </button>
                      );
                    })}
                    {workOrderTags.length === 0 && <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Brak zdefiniowanych tagów. (Ustawienia -&gt; Tagi)</div>}
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="page-subtitle" style={{ marginTop: '16px' }}>{order.description || 'Brak opisu'}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button className="btn btn-secondary" onClick={() => setShowPrintMenu(!showPrintMenu)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Drukuj / Wystaw
            </button>
            {showPrintMenu && (
              <>
                <div 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} 
                  onClick={() => setShowPrintMenu(false)} 
                />
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 100, minWidth: '220px', display: 'flex', flexDirection: 'column', padding: '4px' }}>
                  <div style={{ padding: '8px 12px', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Druk roboczy</div>
                  <DropdownItem href={`/print/${id}?type=acceptance`}>Protokół przyjęcia</DropdownItem>
                  <DropdownItem href={`/print/${id}?type=delivery`}>Protokół wydania</DropdownItem>
                  <DropdownItem href={`/print/${id}?type=order`}>Karta pracy mechanika</DropdownItem>
                  <DropdownItem href={`/print/${id}?type=receipt`}>Kosztorys</DropdownItem>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                  <div style={{ padding: '8px 12px', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Dokumenty sprzedaży</div>
                  <button 
                    style={{ padding: '8px 12px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)', borderRadius: '4px' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-body)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={async () => {
                      setShowPrintMenu(false);
                      const res = await fetch(`/api/work-orders/${id}/invoice`, { method: 'POST', body: JSON.stringify({ type: 'PA' }), headers: { 'Content-Type': 'application/json' } });
                      if(res.ok) { 
                        const data = await res.json();
                        window.open(`/print-sales/${data.id}`, '_blank');
                        window.location.href = '/sales'; 
                      } else { alert('Błąd'); }
                    }}
                  >Wystaw Paragon (PA)</button>
                  <button 
                    style={{ padding: '8px 12px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)', borderRadius: '4px' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-body)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={async () => {
                      setShowPrintMenu(false);
                      const res = await fetch(`/api/work-orders/${id}/invoice`, { method: 'POST', body: JSON.stringify({ type: 'FV' }), headers: { 'Content-Type': 'application/json' } });
                      if(res.ok) { 
                        const data = await res.json();
                        window.open(`/print-sales/${data.id}`, '_blank');
                        window.location.href = '/sales'; 
                      } else { alert('Błąd'); }
                    }}
                  >Wystaw Fakturę (FV)</button>
                </div>
              </>
            )}
          </div>

          {nextCol && (
            <button className="btn btn-primary" onClick={() => updateStatus(nextCol.name)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              Przenieś do: {nextCol.name}
            </button>
          )}
          {prevCol && (
            <button className="btn btn-secondary" onClick={() => updateStatus(prevCol.name)}>
              ↩ Cofnij
            </button>
          )}
          <button 
            className="btn btn-secondary" 
            onClick={() => setOrderToDelete(true)}
            title="Usuń zlecenie"
            style={{ color: 'var(--error)' }}
          >
            <IconTrash size={16} />
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        {/* Customer */}
        <Link href={`/customers/${order.vehicle.customer.id}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
            Klient
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.vehicle.customer.firstName} {order.vehicle.customer.lastName}</span>
            {order.vehicle.customer.tags && order.vehicle.customer.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '4px' }}>
                {order.vehicle.customer.tags.map(tag => (
                  <span key={tag.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '100px', fontSize: '0.65rem', fontWeight: 600,
                    backgroundColor: `${tag.color}15`,
                    color: tag.color,
                    border: `1px solid ${tag.color}30`,
                    whiteSpace: 'nowrap',
                    boxShadow: `0 1px 2px ${tag.color}10`
                  }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: tag.color }}></span>
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: 4 }}>
            {order.vehicle.customer.phone}
          </div>
        </Link>

        {/* Vehicle */}
        <Link href={`/vehicles/${order.vehicle.id}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
            Pojazd
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.vehicle.brand} {order.vehicle.model}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: 'middle' }}><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-6 0H9"/></svg>
            {order.vehicle.plate}
            {order.vehicle.mileage && ` • ${order.vehicle.mileage.toLocaleString()} km`}
          </div>
          {order.vehicle.vin && (
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 4 }}>
              VIN: {order.vehicle.vin}
            </div>
          )}
        </Link>

        {/* Mechanic */}
        <div className="card">
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
            Mechanik
          </div>
          <CustomSelect 
            name="mechanicId"
            className="form-select" 
            style={{ width: '100%', height: 'auto', background: 'var(--bg-body)', border: '1px solid var(--border)' }}
            value={order.mechanic ? mechanics.find(m => m.name === order.mechanic?.name)?.id?.toString() || '' : ''}
            onChange={async (e) => {
              const newMechanicId = e.target.value;
              const newMechObj = mechanics.find(m => m.id.toString() === newMechanicId);
              setOrder({ ...order, mechanic: newMechObj ? { name: newMechObj.name, specialization: newMechObj.specialization } : null });
              await fetch(`/api/work-orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mechanicId: newMechanicId || null }),
              });
            }}
            options={[
              { value: "", label: "Nie przypisany" },
              ...mechanics.map(m => ({ value: m.id.toString(), label: `${m.name} (${m.specialization || 'Uniwersalny'})` }))
            ]}
          />
        </div>

        {/* Additional Info */}
        <div className="card">
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
            Opcje dodatkowe (Druk)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { key: 'returnParts', label: 'Zwrot części do klienta' },
              { key: 'testDrive', label: 'Jazda testowa' },
              { key: 'registrationCert', label: 'Dowód rejestracyjny' },
              { key: 'fillFluids', label: 'Uzupełnić płyny' },
              { key: 'fillLights', label: 'Uzupełnić oświetlenie' },
            ].map(item => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input 
                  type="checkbox" 
                  checked={!!order[item.key as keyof WorkOrderDetail]}
                  onChange={async (e) => {
                    const val = e.target.checked;
                    setOrder({ ...order, [item.key]: val });
                    await fetch(`/api/work-orders/${id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ [item.key]: val }),
                    });
                    loadOrder();
                  }}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Items Table ── */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card-header">
          <h2 className="card-title">Prace i części</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddItem(true)}>
            + Dodaj pozycję
          </button>
        </div>

        {order.items.length > 0 ? (
          <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nazwa</th>
                  <th>Typ</th>
                  <th>Ilość</th>
                  <th>Cena przed rab.</th>
                  <th>Rabat</th>
                  <th>Suma netto/brutto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {serviceItems.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={7} style={{ background: 'var(--bg-body)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--secondary)', padding: '8px var(--space-lg)' }}>
                        Usługi
                      </td>
                    </tr>
                    {serviceItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td><span className="badge badge-in-progress">Usługa</span></td>
                        <td>{item.quantity}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{item.unitPrice.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: item.discount > 0 ? 'var(--success)' : 'inherit' }}>
                          {item.discount > 0 ? `${item.discount}%` : '-'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.8rem' }}>
                          {(item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100)).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                        </td>
                        <td>
                          <button className="btn-icon" onClick={() => setItemToDelete(item.id)} title="Usuń">
                            <IconTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
                {partItems.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={7} style={{ background: 'var(--bg-body)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--warning)', padding: '8px var(--space-lg)' }}>
                        Części
                      </td>
                    </tr>
                    {partItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td><span className="badge badge-pending">Część</span></td>
                        <td>{item.quantity}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{item.unitPrice.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: item.discount > 0 ? 'var(--success)' : 'inherit' }}>
                          {item.discount > 0 ? `${item.discount}%` : '-'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.8rem' }}>
                          {(item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100)).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                        </td>
                        <td>
                          <button className="btn-icon" onClick={() => setItemToDelete(item.id)} title="Usuń">
                            <IconTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
            Brak pozycji. Dodaj prace lub części.
          </div>
        )}

        {/* Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 'var(--space-lg)',
          marginTop: 'var(--space-lg)',
          paddingTop: 'var(--space-md)',
          borderTop: '2px solid var(--border)',
        }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>RAZEM:</span>
          <span style={{ fontSize: '1.35rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--orange)' }}>
            {order.totalAmount.toLocaleString('pl-PL')} zł
          </span>
        </div>

        {order.warehouseDocs && order.warehouseDocs.length > 0 && (
          <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-md)', borderTop: '1px dashed var(--border)' }}>
            <h4 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>Wystawione dokumenty</h4>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {order.warehouseDocs.map((doc: any) => (
                <div key={doc.id} style={{ 
                  background: 'var(--bg-secondary)', 
                  padding: 'var(--space-xs) var(--space-sm)', 
                  borderRadius: 'var(--radius-md)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-sm)',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{doc.documentNumber}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{doc.totalValue.toLocaleString('pl-PL')} zł</span>
                  <button 
                    onClick={() => window.open(`/print-sales/${doc.id}`, '_blank')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                  >Drukuj</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Add Item Modal ── */}
      {showAddItem && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddItem(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Dodaj pozycję</h2>
              <button className="modal-close" onClick={() => setShowAddItem(false)}><IconX size={20} /></button>
            </div>
            <form onSubmit={addItem}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">Typ</label>
                  <CustomSelect 
                    name="itemType"
                    className="form-select" 
                    value={itemType} 
                    onChange={e => {
                      setItemType(e.target.value);
                      setSelectedInvId('');
                      setItemName('');
                      setItemPrice('');
                    }}
                    options={[
                      { value: "service", label: "Usługa" },
                      { value: "part", label: "Część" }
                    ]}
                  />
                </div>

                {itemType === 'part' && (
                  <div className="form-group">
                    <label className="form-label">Wybierz z magazynu (opcjonalnie)</label>
                    <CustomSelect 
                      name="inventoryId"
                      className="form-select"
                      value={selectedInvId}
                      onChange={e => {
                        const val = e.target.value;
                        setSelectedInvId(val);
                        if (val) {
                          const inv = inventoryItems.find(i => i.id.toString() === val);
                          if (inv) {
                            setItemName(inv.name);
                            setItemPrice(inv.sellPrice.toString());
                          }
                        } else {
                          setItemName('');
                          setItemPrice('');
                        }
                      }}
                      options={[
                        { value: "", label: "-- Wpisz ręcznie --" },
                        ...inventoryItems.map(inv => ({ 
                          value: inv.id.toString(), 
                          label: `${inv.itemCode} - ${inv.name} (${inv.quantity} szt. na stanie)` 
                        }))
                      ]}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nazwa *</label>
                  <input className="form-input" value={itemName} onChange={e => setItemName(e.target.value)} required placeholder="Np. Wymiana klocków" />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Ilość</label>
                    <input className="form-input" name="quantity" type="number" defaultValue="1" min="0.01" step="0.01" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cena za szt. (zł) *</label>
                    <input className="form-input" value={itemPrice} onChange={e => setItemPrice(e.target.value)} type="number" step="0.01" required placeholder="150.00" />
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddItem(false)}>Anuluj</button>

                <button type="submit" className="btn btn-primary">Dodaj</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Order Confirmation ── */}
      {orderToDelete && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOrderToDelete(false); }}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Usuń zlecenie</h2>
              <button className="modal-close" onClick={() => setOrderToDelete(false)}><IconX size={20} /></button>
            </div>
            <div style={{ padding: 'var(--space-lg) 0', color: 'var(--text-secondary)' }}>
              Czy na pewno chcesz usunąć to zlecenie? Tej operacji nie można cofnąć.
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setOrderToDelete(false)}>Anuluj</button>
              <button type="button" className="btn btn-primary" style={{ background: 'var(--error)', borderColor: 'var(--error)' }} onClick={async () => {
                await fetch(`/api/work-orders/${id}`, { method: 'DELETE' });
                window.location.href = '/work-orders';
              }}>Usuń</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Item Confirmation ── */}
      {itemToDelete !== null && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setItemToDelete(null); }}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Usuń pozycję</h2>
              <button className="modal-close" onClick={() => setItemToDelete(null)}><IconX size={20} /></button>
            </div>
            <div style={{ padding: 'var(--space-lg) 0', color: 'var(--text-secondary)' }}>
              Czy na pewno chcesz usunąć tę pozycję z rachunku?
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setItemToDelete(null)}>Anuluj</button>
              <button type="button" className="btn btn-primary" style={{ background: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => removeItem(itemToDelete)}>Usuń</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
