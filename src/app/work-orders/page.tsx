'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { IconAlertTriangle, IconX, IconTrash } from '@/components/Icons';
import { CustomSelect } from '@/components/CustomSelect';
import { ConfirmModal } from '@/components/ConfirmModal';
import { EmptyState } from '@/components/EmptyState';

import type { WorkOrderWithDetails as WorkOrder, Customer, Mechanic, ColumnDef } from '@/types';

function QuickTagAdder({ orderId, currentTags, allTags, onUpdate }: { orderId: number, currentTags: any[], allTags: any[], onUpdate: (newTags: any[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const toggleTag = async (tag: any) => {
    const isSelected = currentTags.some((t: any) => t.id === tag.id);
    let newTags = [];
    if (isSelected) {
      newTags = currentTags.filter((t: any) => t.id !== tag.id);
    } else {
      newTags = [...currentTags, tag];
    }
    
    // Optimistic update
    onUpdate(newTags);

    try {
      await fetch(`/api/work-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds: newTags.map(t => t.id) })
      });
    } catch (e) {
      console.error('Failed to update tags', e);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '18px', height: '18px', borderRadius: '4px',
          background: 'var(--bg-hover)', border: '1px dashed var(--border)',
          color: 'var(--text-muted)', cursor: 'pointer', padding: 0
        }}
        title="Dodaj tag"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '4px',
          background: 'var(--bg-white, #FFFFFF)', border: '1px solid var(--border)',
          borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 100, minWidth: '150px', maxHeight: '200px', overflowY: 'auto', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px'
        }}>
          {allTags.length === 0 ? (
            <div style={{ padding: '6px 8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Brak tagów</div>
          ) : (
            allTags.map(tag => {
              const isSelected = currentTags.some((t: any) => t.id === tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={(e) => { e.stopPropagation(); toggleTag(tag); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px',
                    background: isSelected ? 'var(--bg-hover)' : 'transparent',
                    border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left',
                    color: 'var(--text-primary)', fontSize: '0.75rem'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tag.color || 'var(--text-muted)' }}></span>
                  {tag.name}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const defaultColumns: ColumnDef[] = [
  { id: 0, key: 'pending', title: 'Oczekujące', color: 'var(--warning)' },
  { id: 0, key: 'in_progress', title: 'W trakcie', color: 'var(--secondary)' },
  { id: 0, key: 'done', title: 'Zakończone', color: 'var(--success)' },
];

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [columnsLoaded, setColumnsLoaded] = useState(false);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<ColumnDef | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  const router = useRouter();
  
  const [search, setSearch] = useState('');
  const [mechanicFilter, setMechanicFilter] = useState('all');
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadColumns = async () => {
    try {
      const res = await fetch('/api/tags?entity=work_order_status');
      const tags = await res.json();
      if (tags && tags.length > 0) {
        setColumns(tags.map((t: any) => ({
          id: t.id,
          key: t.name,
          title: t.name,
          color: t.color || 'var(--secondary)'
        })));
      } else {
        setColumns(defaultColumns);
      }
    } catch (e) {
      console.error(e);
      setColumns(defaultColumns);
    } finally {
      setColumnsLoaded(true);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadColumns();
    fetch('/api/tags?entity=work_order_tag')
      .then(res => res.json())
      .then(data => setAllTags(data || []))
      .catch(e => console.error(e));
  }, []);

  const loadOrders = useCallback(async (pageNum: number, isReset: boolean) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/work-orders?page=${pageNum}&limit=50`);
      const json = await res.json();
      
      if (!res.ok || json.error) {
        console.error("API Error:", json.error || "Unknown error");
        return;
      }
      
      const fetchedData = json.data || json; // fallback just in case
      const fetchedCounts = json.counts || {};
      
      if (!Array.isArray(fetchedData)) {
        console.error("Expected array but got:", fetchedData);
        return;
      }
      
      if (fetchedData.length < 50) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      setOrders(prev => isReset ? fetchedData : [...prev, ...fetchedData]);
      setCounts(fetchedCounts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []); // omit loading

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadOrders(1, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreateModal = () => {
    router.push('/work-orders/form');
  };

  // handleCreate moved to /work-orders/form

  const handleAddColumn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const color = form.get('color') as string;
    if (!name) return;
    
    await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'work_order_status', name, color })
    });
    
    setShowAddColumnModal(false);
    loadColumns();
  };

  const updateStatus = async (id: number, newStatus: string) => {
    // Optimistic update
    setOrders((current) => {
      const order = current.find(o => o.id === id);
      if (order && order.status !== newStatus) {
        setCounts(prev => ({
          ...prev,
          [order.status]: Math.max(0, (prev[order.status] || 0) - 1),
          [newStatus]: (prev[newStatus] || 0) + 1
        }));
      }
      return current.map((o) => (o.id === id ? { ...o, status: newStatus } : o));
    });
    await fetch(`/api/work-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination, draggableId, type } = result;

    if (type === 'COLUMN') {
      const newColumns = Array.from(columns);
      const [movedColumn] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, movedColumn);
      
      setColumns(newColumns); // Optimistic UI update

      try {
        const orderData = newColumns.map((c, i) => ({ id: c.id, order: i }));
        await fetch('/api/tags/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
      } catch (err) {
        console.error("Failed to reorder columns", err);
      }
      return;
    }

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    const id = parseInt(draggableId);

    if (sourceCol === destCol) {
      // Reordering within the same column
      const colOrders = orders.filter(o => o.status === sourceCol);
      const [moved] = colOrders.splice(source.index, 1);
      colOrders.splice(destination.index, 0, moved);
      
      const updates = colOrders.map((o, idx) => ({ id: o.id, order: idx }));
      
      setOrders(current => {
        const map = new Map(updates.map(u => [u.id, u.order]));
        return [...current].map(o => {
          if (map.has(o.id)) {
            return { ...o, order: map.get(o.id)! };
          }
          return o;
        }).sort((a, b) => (a.order || 0) - (b.order || 0));
      });

      fetch('/api/work-orders/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).catch(console.error);
    } else {
      // Moving to a different column
      const sourceColOrders = orders.filter(o => o.status === sourceCol);
      const destColOrders = orders.filter(o => o.status === destCol);
      
      const [moved] = sourceColOrders.splice(source.index, 1);
      moved.status = destCol;
      destColOrders.splice(destination.index, 0, moved);

      const destUpdates = destColOrders.map((o, idx) => ({ id: o.id, order: idx }));
      
      setOrders(current => {
        const map = new Map(destUpdates.map(u => [u.id, u.order]));
        return [...current].map(o => {
          if (o.id === id) {
            return { ...o, status: destCol, order: map.get(o.id)! };
          }
          if (map.has(o.id)) {
            return { ...o, order: map.get(o.id)! };
          }
          return o;
        }).sort((a, b) => (a.order || 0) - (b.order || 0));
      });

      setCounts(prev => ({
        ...prev,
        [sourceCol]: Math.max(0, (prev[sourceCol] || 0) - 1),
        [destCol]: (prev[destCol] || 0) + 1
      }));

      // 1. Update status
      fetch(`/api/work-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: destCol }),
      }).catch(console.error);

      // 2. Update order in destination
      fetch('/api/work-orders/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(destUpdates)
      }).catch(console.error);
    }
  };

  // Removed early return null to prevent hydration crash

  const orderMechanics = ['all', ...new Set(orders.map(o => o.mechanic?.name).filter(Boolean))].sort();

  const handleDeleteColumn = async () => {
    if (!columnToDelete) return;
    try {
      const res = await fetch(`/api/tags/${columnToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setColumnToDelete(null);
        loadColumns();
        // Option: we might also want to reload orders to reflect that they are gone from the UI,
        // but loadOrders will fetch the updated list from the DB where they are deleted.
        loadOrders(1, true);
      } else {
        alert('Błąd podczas usuwania kolumny');
      }
    } catch (e) {
      console.error(e);
      alert('Błąd podczas usuwania kolumny');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = `${o.vehicle.brand} ${o.vehicle.model} ${o.vehicle.plate} ${o.description || ''} ${o.vehicle.customer.firstName} ${o.vehicle.customer.lastName}`.toLowerCase().includes(search.toLowerCase());
      const matchesMechanic = mechanicFilter === 'all' || (o.mechanic?.name === mechanicFilter);
      return matchesSearch && matchesMechanic;
    });
  }, [orders, search, mechanicFilter]);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Zlecenia</h1>
          <p className="page-subtitle">Zarządzanie zleceniami napraw</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-outline" onClick={() => setShowAddColumnModal(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Dodaj kolumnę
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nowe zlecenie
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="filter-bar">
        <div className="search-bar">
          <svg className="search-bar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="form-input" placeholder="Szukaj zlecenia (pojazd, opis, nr rej., klient)..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <CustomSelect 
          name="mechanicFilter"
          className="form-select" 
          value={mechanicFilter} 
          onChange={e => setMechanicFilter(e.target.value)} 
          style={{ minWidth: 160, width: 160 }}
          options={[
            { value: "all", label: "Wszyscy mechanicy" },
            ...orderMechanics.filter(m => m !== 'all').map(m => ({ value: m as string, label: m as string }))
          ]}
        />
      </div>

      {/* Kanban Board */}
      <div 
        className="kanban-board"
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
      >
        {!columnsLoaded ? (
          // Skeleton for loading to avoid showing wrong columns or layout shift
          [1, 2, 3].map((skeletonId) => (
            <div key={skeletonId} className="kanban-column" style={{ opacity: 0.5 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '150px', background: `linear-gradient(180deg, color-mix(in srgb, var(--border) 10%, transparent) 0%, transparent 100%)`, zIndex: 0, borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }} />
              <div className="kanban-column-header" style={{ position: 'relative', zIndex: 1 }}>
                <div className="kanban-column-title" style={{ width: '120px', height: '18px', background: 'var(--border)', borderRadius: '4px' }} />
              </div>
            </div>
          ))
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="board" type="COLUMN" direction="horizontal">
              {(providedBoard) => (
                <div 
                  style={{ display: 'flex', gap: 'var(--space-md)', height: '100%', alignItems: 'flex-start' }}
                  ref={providedBoard.innerRef}
                  {...providedBoard.droppableProps}
                >
                  {columns.map((col, index) => {
                    const colOrders = filteredOrders.filter((o) => o.status === col.key);
                    return (
                      <Draggable key={col.key} draggableId={col.key} index={index}>
                        {(providedCol, snapshotCol) => (
                          <div
                            className={`kanban-column ${snapshotCol.isDragging ? 'kanban-column--dragging' : ''}`}
                            ref={providedCol.innerRef}
                            {...providedCol.draggableProps}
                            style={{
                              ...providedCol.draggableProps.style,
                            }}
                          >
                            <div style={{
                              position: 'absolute',
                              top: 0, left: 0, right: 0,
                              height: '150px',
                              background: `linear-gradient(180deg, color-mix(in srgb, ${col.color} 5%, transparent) 0%, transparent 100%)`,
                              pointerEvents: 'none',
                              zIndex: 0,
                              borderTopLeftRadius: 'var(--radius-lg)',
                              borderTopRightRadius: 'var(--radius-lg)'
                            }} />
                            
                            <div 
                              className="kanban-column-header" 
                              {...providedCol.dragHandleProps}
                              style={{ position: 'relative', zIndex: 1, cursor: 'grab' }}
                            >
                              <div className="kanban-column-title">
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                                {col.title}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="kanban-count">{counts[col.key] !== undefined ? counts[col.key] : colOrders.length}</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setColumnToDelete(col);
                                  }}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                  title="Usuń kolumnę"
                                >
                                  <IconTrash size={14} />
                                </button>
                              </div>
                            </div>

                            <Droppable droppableId={col.key} type="CARD">
                              {(provided, snapshot) => (
                                <div 
                                  className="kanban-cards" 
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  onWheel={(e) => e.stopPropagation()} /* Prevent vertical scroll from shifting the board */
                                  style={{ 
                                    minHeight: '150px', 
                                    position: 'relative', 
                                    zIndex: 1,
                                    background: 'transparent',
                                    borderRadius: 'var(--radius-md)'
                                  }}
                                >
                                  {colOrders.map((order, orderIndex) => (
                                    <Draggable key={order.id} draggableId={order.id.toString()} index={orderIndex}>
                                      {(providedCard, snapshotCard) => (
                                        <div
                                          ref={providedCard.innerRef}
                                          {...providedCard.draggableProps}
                                          {...providedCard.dragHandleProps}
                                          className={`kanban-card ${snapshotCard.isDragging ? 'kanban-card--dragging' : ''}`}
                                          style={{
                                            ...providedCard.draggableProps.style,
                                          }}
                                        >
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xs)' }}>
                                            <Link href={`/work-orders/${order.id}`} style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                              {`ZL${order.id}/${(new Date(order.createdAt).getMonth() + 1).toString().padStart(2, '0')}/${new Date(order.createdAt).getFullYear()}`} — {order.vehicle.brand} {order.vehicle.model}
                                            </Link>
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOrderToDelete(order.id);
                                              }}
                                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                              title="Usuń zlecenie"
                                            >
                                              <IconTrash size={16} />
                                            </button>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-xs)', flexWrap: 'wrap' }}>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                              {order.vehicle.customer.firstName} {order.vehicle.customer.lastName}
                                            </div>
                                            {((order.vehicle.customer as any).tags) && ((order.vehicle.customer as any).tags as any[]).length > 0 && (
                                              <div style={{ display: 'flex', gap: '4px' }}>
                                                {((order.vehicle.customer as any).tags as any[]).map((tag: any) => (
                                                  <span key={tag.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 5px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 600, backgroundColor: `${tag.color}15`, color: tag.color, border: `1px solid ${tag.color}30` }}>
                                                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: tag.color }}></span>
                                                    {tag.name}
                                                  </span>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          {order.description && (
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                              {order.description}
                                            </div>
                                          )}
                                          {((order as any).tags) && (
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }}>
                                              {((order as any).tags as any[]).map((tag: any) => (
                                                <span key={tag.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, backgroundColor: `${tag.color}15`, color: tag.color, border: `1px solid ${tag.color}30` }}>
                                                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: tag.color }}></span>
                                                  {tag.name}
                                                  <button
                                                    onClick={(e) => { 
                                                      e.stopPropagation(); 
                                                      const newTags = ((order as any).tags as any[]).filter((t: any) => t.id !== tag.id);
                                                      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, tags: newTags } as any : o));
                                                      fetch(`/api/work-orders/${order.id}`, {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ tagIds: newTags.map((t: any) => t.id) })
                                                      }).catch(e => console.error(e));
                                                    }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'inherit', marginLeft: '2px', opacity: 0.7 }}
                                                    title="Usuń tag"
                                                  >
                                                    <IconX size={10} />
                                                  </button>
                                                </span>
                                              ))}
                                              <QuickTagAdder 
                                                orderId={order.id} 
                                                currentTags={order.tags || []} 
                                                allTags={allTags}
                                                onUpdate={(newTags) => {
                                                  setOrders(prev => prev.map(o => o.id === order.id ? { ...o, tags: newTags } as any : o));
                                                }}
                                              />
                                            </div>
                                          )}
                                          <div className="kanban-card-meta">
                                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--orange)', fontSize: '0.78rem' }}>
                                              {order.totalAmount.toLocaleString('pl-PL')} zł
                                            </span>
                                            {order.mechanicId && (
                                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                {order.mechanic ? order.mechanic.name : `Mech #${order.mechanicId}`}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                  {colOrders.length === 0 && !snapshot.isDraggingOver && (
                                    <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                      {(loading && orders.length === 0) ? 'Ładowanie...' : 'Pusto'}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {providedBoard.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      <div style={{ height: '60px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {loading && orders.length > 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ładowanie kolejnych zleceń...</span>
        )}
        {hasMore && !loading && (
          <button 
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              loadOrders(nextPage, false);
            }}
            style={{
              padding: '8px 16px',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: 'var(--text-primary)'
            }}
          >
            Załaduj starsze zlecenia
          </button>
        )}
      </div>



      {/* ── Modal: Delete Confirmation ── */}
      {orderToDelete !== null && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOrderToDelete(null); }}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Usuń zlecenie</h2>
              <button className="modal-close" onClick={() => setOrderToDelete(null)}><IconX size={20} /></button>
            </div>
            <div style={{ padding: 'var(--space-lg) 0', color: 'var(--text-secondary)' }}>
              Czy na pewno chcesz usunąć to zlecenie? Tej operacji nie można cofnąć.
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setOrderToDelete(null)}>Anuluj</button>
              <button type="button" className="btn btn-primary" style={{ background: 'var(--error)', borderColor: 'var(--error)' }} onClick={async () => {
                await fetch(`/api/work-orders/${orderToDelete}`, { method: 'DELETE' });
                setOrderToDelete(null);
                setPage(1);
                loadOrders(1, true);
              }}>Usuń</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add Column ── */}
      {showAddColumnModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddColumnModal(false); }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">Dodaj status (kolumnę)</h2>
              <button className="btn-icon" onClick={() => setShowAddColumnModal(false)}>
                <IconX size={20} />
              </button>
            </div>
            <form onSubmit={handleAddColumn}>
              <div className="modal-body" style={{ padding: 'var(--space-md) 0' }}>
                <div className="form-group">
                  <label className="form-label">Nazwa statusu</label>
                  <input type="text" name="name" className="form-input" required placeholder="np. Czeka na części" />
                </div>
                <div className="form-group">
                  <label className="form-label">Kolor</label>
                  <input type="color" name="color" className="form-input" defaultValue="#4A7BF7" style={{ padding: '0', height: '40px' }} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddColumnModal(false)}>Anuluj</button>
                <button type="submit" className="btn btn-primary">Zapisz status</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!columnToDelete}
        onClose={() => setColumnToDelete(null)}
        onConfirm={handleDeleteColumn}
        title="Удалить колонку"
        message={<>Вы уверены, что хотите удалить колонку <strong>{columnToDelete?.title}</strong>?</>}
        warningMessage="Внимание: Удаление этой колонки приведет к перемещению всех находящихся в ней заказ-нарядов в корзину!"
      />
    </div>
  );
}
