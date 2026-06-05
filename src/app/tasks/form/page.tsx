'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDialog } from '@/contexts/DialogContext';
import { CustomSelect } from '@/components/CustomSelect';

function TaskForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useDialog();
  const id = searchParams.get('id');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  
  const [formData, setFormData] = useState({
    title: '',
    assignee: '',
    due: '',
    priority: 'medium'
  });

  useEffect(() => {
    if (id) {
      fetch(`/api/tasks/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(data => {
          setFormData({
            title: data.title || '',
            assignee: data.assignee || '',
            due: data.due || '',
            priority: data.priority || 'medium'
          });
        })
        .catch(() => {
          router.push('/tasks');
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
        const res = await fetch(`/api/tasks`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: Number(id), ...formData }),
        });
        if (res.ok) {
          router.push('/tasks');
        } else {
          await showAlert('Błąd podczas aktualizacji zadania.');
        }
      } else {
        // Fetch first column to set status if creating
        const tagsRes = await fetch('/api/tags');
        const tags = await tagsRes.json();
        const columns = tags.filter((t: any) => t.entity === 'task_status').sort((a: any, b: any) => a.order - b.order);
        const status = columns[0]?.name || 'Do zrobienia';

        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, status }),
        });
        if (res.ok) {
          router.push('/tasks');
        } else {
          await showAlert('Błąd podczas tworzenia zadania.');
        }
      }
    } catch (err) {
      console.error(err);
      await showAlert('Wystąpił błąd.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Czy na pewno chcesz usunąć to zadanie?')) {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      router.push('/tasks');
    }
  };

  if (fetching) return <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>Ładowanie...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 className="page-title">{id ? 'Edytuj zadanie' : 'Nowe zadanie'}</h1>
        <p className="page-subtitle">Zarządzanie szczegółami zadania</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Szczegóły</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Tytuł zadania *</label>
              <input required type="text" name="title" className="form-input" value={formData.title} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Wykonawca</label>
              <input type="text" name="assignee" className="form-input" value={formData.assignee} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Termin (opcjonalnie)</label>
              <input type="date" name="due" className="form-input" value={formData.due} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Priorytet</label>
              <CustomSelect 
                name="priority" 
                className="form-select" 
                value={formData.priority}
                onChange={handleChange as any}
                options={[
                  { value: "high", label: "Wysoki" },
                  { value: "medium", label: "Średni" },
                  { value: "low", label: "Niski" }
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: id ? 'space-between' : 'flex-end', marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border)' }}>
            {id ? (
              <button type="button" className="btn btn-secondary" style={{ color: 'var(--error)' }} onClick={handleDelete}>
                Usuń
              </button>
            ) : <div/>}
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => router.push('/tasks')}>
                Anuluj
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function TaskFormPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>Ładowanie...</div>}>
      <TaskForm />
    </Suspense>
  );
}
