'use client';

import { useState, useEffect } from 'react';
import { CustomSelect } from '@/components/CustomSelect';
import { useDialog } from '@/contexts/DialogContext';

type Tag = {
  id: number;
  entity: string;
  name: string;
  color: string;
};

const ENTITY_LABELS: Record<string, string> = {
  product_category: 'Kategoria towaru',
  work_order_status: 'Status zlecenia',
  customer_tag: 'Etykieta klienta',
  work_order_tag: 'Etykieta zlecenia (Tag)',
};

export default function TagsSettings() {
  const { showAlert, showConfirm } = useDialog();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    entity: 'product_category',
    name: '',
    color: '#4A7BF7'
  });

  const loadTags = () => {
    setLoading(true);
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => {
        setTags(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setFormData({
      entity: tag.entity,
      name: tag.name,
      color: tag.color
    });
    // Scroll to top where the form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      entity: 'product_category',
      name: '',
      color: '#4A7BF7'
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    if (editingId) {
      const res = await fetch(`/api/tags/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setEditingId(null);
        setFormData(prev => ({ ...prev, name: '' })); // keep entity and color
        loadTags();
      } else {
        await showAlert('Błąd podczas aktualizacji tagu.');
      }
    } else {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setFormData(prev => ({ ...prev, name: '' })); // keep entity and color
        loadTags();
      } else {
        await showAlert('Błąd podczas zapisywania tagu (być może nazwa już istnieje w tej kategorii).');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (await showConfirm('Czy na pewno chcesz usunąć ten tag? Usunięcie wpłynie na przypisane elementy.')) {
      const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadTags();
      } else {
        await showAlert('Błąd podczas usuwania.');
      }
    }
  };

  if (loading) return <div>Ładowanie...</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Zarządzanie tagami</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2xl)' }}>
        Konfiguruj kategorie i etykiety używane w całym systemie (np. kategorie towarów, statusy zleceń). Wybierz dla każdego unikalny kolor.
      </p>

      <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)', border: editingId ? '1px solid var(--orange)' : '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-lg)', color: editingId ? 'var(--orange)' : 'var(--text-primary)' }}>
          {editingId ? 'Edytuj tag' : 'Dodaj nowy tag'}
        </h3>
        
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto auto', gap: 'var(--space-md)', alignItems: 'end' }}>
          <div className="form-group">
            <label>Typ (Gdzie używać)</label>
            <CustomSelect 
              name="entity" 
              className="form-select" 
              value={formData.entity} 
              onChange={handleChange as any}
              options={Object.entries(ENTITY_LABELS).map(([key, label]) => ({ value: key, label }))}
              disabled={editingId !== null} // cannot change entity when editing
            />
          </div>
          <div className="form-group">
            <label>Nazwa tagu</label>
            <input required type="text" name="name" className="form-input" placeholder="np. Filtry, VIP..." value={formData.name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Kolor</label>
            <input type="color" name="color" className="form-input" style={{ padding: '4px', height: '42px', width: '60px', cursor: 'pointer' }} value={formData.color} onChange={handleChange} />
          </div>
          <div className="form-group" style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
              {editingId ? 'Zapisz zmiany' : 'Dodaj'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" style={{ height: '42px' }} onClick={handleCancelEdit}>Anuluj</button>
            )}
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Typ</th>
              <th>Nazwa tagu</th>
              <th>Kolor</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {tags.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>Brak tagów do wyświetlenia</td></tr>
            ) : tags.map(tag => (
              <tr key={tag.id}>
                <td style={{ color: 'var(--text-muted)' }}>{ENTITY_LABELS[tag.entity] || tag.entity}</td>
                <td style={{ fontWeight: 500 }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', padding: '3px 10px', 
                    borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600,
                    backgroundColor: `${tag.color}26`,
                    color: tag.color,
                    border: `1px solid ${tag.color}40`
                  }}>
                    {tag.name}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: tag.color }}></div>
                    {tag.color}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleEdit(tag)}>Edytuj</button>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)' }} onClick={() => handleDelete(tag.id)}>Usuń</button>
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
