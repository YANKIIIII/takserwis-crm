'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDialog } from '@/contexts/DialogContext';

export default function TrashPage() {
  const [activeTab, setActiveTab] = useState<'workOrders' | 'tasks'>('workOrders');
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showConfirm, showAlert } = useDialog();

  const loadData = () => {
    setLoading(true);
    fetch('/api/trash')
      .then(res => res.json())
      .then(data => {
        setWorkOrders(data.workOrders || []);
        setTasks(data.tasks || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRestore = async (type: string, id: number) => {
    try {
      const res = await fetch(`/api/trash/${type}/${id}`, { method: 'POST' });
      if (res.ok) {
        loadData();
      } else {
        showAlert('Wystąpił błąd podczas przywracania.');
      }
    } catch (err) {
      showAlert('Wystąpił błąd podczas przywracania.');
    }
  };

  const handleHardDelete = async (type: string, id: number) => {
    if (await showConfirm('Czy na pewno chcesz usunąć ten element bezpowrotnie? Tej operacji nie można cofnąć.')) {
      try {
        const res = await fetch(`/api/trash/${type}/${id}`, { method: 'DELETE' });
        if (res.ok) {
          loadData();
        } else {
          showAlert('Wystąpił błąd podczas usuwania.');
        }
      } catch (err) {
        showAlert('Wystąpił błąd podczas usuwania.');
      }
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-muted)' }}>Ładowanie...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
            Kosz (Elementy usunięte)
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Zarządzaj elementami, które zostały usunięte z systemu.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('workOrders')}
          style={{
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'workOrders' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'workOrders' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'workOrders' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
        >
          Zlecenia ({workOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'tasks' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'tasks' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'tasks' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
        >
          Zadania ({tasks.length})
        </button>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              {activeTab === 'workOrders' ? (
                <>
                  <th>Pojazd</th>
                  <th>Data usunięcia</th>
                  <th>Kwota</th>
                </>
              ) : (
                <>
                  <th>Tytuł</th>
                  <th>Data usunięcia</th>
                  <th>Status</th>
                </>
              )}
              <th style={{ textAlign: 'right' }}>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {activeTab === 'workOrders' && workOrders.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Kosz zleceń jest pusty</td></tr>
            )}
            {activeTab === 'tasks' && tasks.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Kosz zadań jest pusty</td></tr>
            )}
            
            {activeTab === 'workOrders' && workOrders.map(wo => (
              <tr key={wo.id}>
                <td style={{ fontWeight: 500 }}>#{wo.id}</td>
                <td>{wo.vehicle ? `${wo.vehicle.brand} ${wo.vehicle.model} (${wo.vehicle.plate})` : 'Brak pojazdu'}</td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(wo.deletedAt || wo.updatedAt).toLocaleString()}</td>
                <td style={{ fontWeight: 600 }}>{wo.totalAmount} PLN</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => handleRestore('work-order', wo.id)} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                      Przywróć
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleHardDelete('work-order', wo.id)} style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>
                      Usuń na zawsze
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {activeTab === 'tasks' && tasks.map(task => (
              <tr key={task.id}>
                <td style={{ fontWeight: 500 }}>#{task.id}</td>
                <td style={{ fontWeight: 500 }}>{task.title}</td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(task.deletedAt || task.updatedAt).toLocaleString()}</td>
                <td>{task.status}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => handleRestore('task', task.id)} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                      Przywróć
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleHardDelete('task', task.id)} style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>
                      Usuń na zawsze
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
