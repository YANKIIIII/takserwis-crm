'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Task } from '@prisma/client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { CustomSelect } from '@/components/CustomSelect';
import { useDialog } from '@/contexts/DialogContext';
import { IconX, IconTrash } from '@/components/Icons';
import { ConfirmModal } from '@/components/ConfirmModal';

const priorityMap: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: 'Wysoki', color: '#DC2626', bg: '#FEF2F2' },
  medium: { label: 'Średni', color: '#D97706', bg: '#FFFBEB' },
  low: { label: 'Niski', color: '#059669', bg: '#ECFDF5' },
};

interface ColumnDef {
  id: number;
  key: string;
  title: string;
  color: string;
}

const defaultColumns: ColumnDef[] = [
  { id: 0, key: 'Do zrobienia', title: 'Do zrobienia', color: 'var(--warning)' },
  { id: 0, key: 'W trakcie', title: 'W trakcie', color: 'var(--secondary)' },
  { id: 0, key: 'Zakończone', title: 'Zakończone', color: 'var(--success)' },
];

export default function TasksPage() {
  const router = useRouter();
  const { showConfirm } = useDialog();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns);
  const [isMounted, setIsMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<ColumnDef | null>(null);

  const loadColumns = async () => {
    try {
      const res = await fetch('/api/tags?entity=task_status');
      const tags = await res.json();
      if (tags && tags.length > 0) {
        setColumns(tags.map((t: any) => ({
          id: t.id,
          key: t.name,
          title: t.name,
          color: t.color || 'var(--secondary)'
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = () => {
    fetch('/api/tasks').then(res => res.json()).then(data => setTasks(data));
  };

  useEffect(() => {
    setIsMounted(true);
    loadColumns();
    loadData();
  }, []);

  const moveTask = async (id: number, newStatus: string) => {
    // Optimistic update
    setTasks(t => t.map(x => x.id === id ? { ...x, status: newStatus } : x));
    await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus })
    });
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination, draggableId, type } = result;

    if (type === 'COLUMN') {
      const newColumns = Array.from(columns);
      const [movedColumn] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, movedColumn);
      setColumns(newColumns);

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
      const colTasks = tasks.filter(t => t.status === sourceCol);
      const [moved] = colTasks.splice(source.index, 1);
      colTasks.splice(destination.index, 0, moved);

      const updates = colTasks.map((t, idx) => ({ id: t.id, order: idx }));

      setTasks(current => {
        const map = new Map(updates.map(u => [u.id, u.order]));
        return [...current].map(t => {
          if (map.has(t.id)) {
            return { ...t, order: map.get(t.id)! };
          }
          return t;
        }).sort((a, b) => ((a as any).order || 0) - ((b as any).order || 0));
      });

      fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).catch(console.error);
    } else {
      // Moving to a different column
      const sourceColTasks = tasks.filter(t => t.status === sourceCol);
      const destColTasks = tasks.filter(t => t.status === destCol);

      const [moved] = sourceColTasks.splice(source.index, 1);
      moved.status = destCol;
      destColTasks.splice(destination.index, 0, moved);

      const destUpdates = destColTasks.map((t, idx) => ({ id: t.id, order: idx }));

      setTasks(current => {
        const map = new Map(destUpdates.map(u => [u.id, u.order]));
        return [...current].map(t => {
          if (t.id === id) {
            return { ...t, status: destCol, order: map.get(t.id)! };
          }
          if (map.has(t.id)) {
            return { ...t, order: map.get(t.id)! };
          }
          return t;
        }).sort((a, b) => ((a as any).order || 0) - ((b as any).order || 0));
      });

      // 1. Update status
      fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: destCol })
      }).catch(console.error);

      // 2. Update order in destination
      fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(destUpdates)
      }).catch(console.error);
    }
  };

  const handleAddColumn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const color = form.get('color') as string;
    
    await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'task_status', name, color, order: columns.length })
    });

    setShowAddColumnModal(false);
    loadColumns();
  };

  const handleOpenModal = (task?: any) => {
    if (task) {
      router.push(`/tasks/form?id=${task.id}`);
    } else {
      router.push('/tasks/form');
    }
  };

  const handleDeleteColumn = async () => {
    if (!columnToDelete) return;
    try {
      const res = await fetch(`/api/tags/${columnToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setColumnToDelete(null);
        loadColumns();
        loadData();
      } else {
        alert('Błąd podczas usuwania kolumny');
      }
    } catch (e) {
      console.error(e);
      alert('Błąd podczas usuwania kolumny');
    }
  };

  // handleDelete moved to /tasks/form

  const assignees = ['all', ...new Set(tasks.map(t => t.assignee).filter(Boolean))].sort();

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = `${t.title} ${t.assignee}`.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'all' || t.assignee === assigneeFilter;
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Zadania</h1><p className="page-subtitle">Zarządzanie zadaniami zespołu</p></div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-outline" onClick={() => setShowAddColumnModal(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Dodaj kolumnę
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ Nowe zadanie</button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="filter-bar">
        <div className="search-bar">
          <svg className="search-bar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="form-input" placeholder="Szukaj zadania..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <CustomSelect 
          name="priorityFilter"
          className="form-select" 
          value={priorityFilter} 
          onChange={e => setPriorityFilter(e.target.value)} 
          style={{ minWidth: 160, width: 160 }}
          options={[
            { value: "all", label: "Wszystkie priorytety" },
            { value: "high", label: "Wysoki" },
            { value: "medium", label: "Średni" },
            { value: "low", label: "Niski" }
          ]}
        />
        <CustomSelect 
          name="assigneeFilter"
          className="form-select" 
          value={assigneeFilter} 
          onChange={e => setAssigneeFilter(e.target.value)} 
          style={{ minWidth: 160, width: 160 }}
          options={[
            { value: "all", label: "Wszyscy wykonawcy" },
            ...assignees.filter(a => a !== 'all').map(a => ({ value: a as string, label: a as string }))
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
        {!isMounted ? (
          // Skeleton for SSR to avoid layout shift
          columns.map((col) => (
            <div key={col.key} className="kanban-column">
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '150px', background: `linear-gradient(180deg, color-mix(in srgb, ${col.color} 5%, transparent) 0%, transparent 100%)`, zIndex: 0, borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }} />
              <div className="kanban-column-header" style={{ position: 'relative', zIndex: 1 }}>
                <div className="kanban-column-title">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                  {col.title}
                </div>
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
                    const colTasks = filteredTasks.filter(t => t.status === col.key);
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
                                <span className="kanban-count">{colTasks.length}</span>
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
                                  onWheel={(e) => e.stopPropagation()}
                                  style={{ 
                                    minHeight: '150px', 
                                    position: 'relative', 
                                    zIndex: 1,
                                    background: 'transparent',
                                    borderRadius: 'var(--radius-md)'
                                  }}
                                >
                                  {colTasks.map((task, taskIndex) => {
                                    const p = priorityMap[task.priority] || priorityMap.medium;
                                    return (
                                      <Draggable key={task.id} draggableId={task.id.toString()} index={taskIndex}>
                                        {(providedCard, snapshotCard) => (
                                          <div
                                            ref={providedCard.innerRef}
                                            {...providedCard.draggableProps}
                                            {...providedCard.dragHandleProps}
                                            className={`kanban-card ${snapshotCard.isDragging ? 'kanban-card--dragging' : ''}`}
                                            style={{
                                              ...providedCard.draggableProps.style,
                                              cursor: 'grab'
                                            }}
                                          >
                                            <Link href={`/tasks/form?id=${task.id}`} style={{ display: 'block', width: '100%', height: '100%', textDecoration: 'none', color: 'inherit' }}>
                                              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>{task.title}</div>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                <span>{task.assignee || 'Brak'}</span>
                                                <span style={{ background: p.bg, color: p.color, padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '0.68rem' }}>{p.label}</span>
                                              </div>
                                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>Termin: {task.due || 'Brak'}</div>
                                            </Link>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {provided.placeholder}
                                  {colTasks.length === 0 && !snapshot.isDraggingOver && (
                                    <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                      Pusto
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
                  <input type="text" name="name" className="form-input" required placeholder="np. Do weryfikacji" />
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
        title="Usuń kolumnę"
        message={<>Czy na pewno chcesz usunąć kolumnę <strong>{columnToDelete?.title}</strong>?</>}
        warningMessage="Usunięcie tej kolumny spowoduje również trwałe usunięcie wszystkich znajdujących się w niej zadań!"
      />
    </div>
  );
}
