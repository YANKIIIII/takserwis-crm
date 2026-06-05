'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TagSelector } from '@/components/TagSelector';
import { CustomSelect } from '@/components/CustomSelect';
import { useDialog } from '@/contexts/DialogContext';

function ProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { showAlert } = useDialog();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [formData, setFormData] = useState({
    itemCode: '',
    name: '',
    category: 'Części',
    quantity: 0,
    minStock: 0,
    unit: 'szt.',
    purchasePrice: 0,
    sellPrice: 0
  });

  useEffect(() => {
    if (id) {
      fetch(`/api/products/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Product not found');
          return res.json();
        })
        .then(data => {
          setFormData({
            itemCode: data.itemCode || '',
            name: data.name || '',
            category: data.category || 'Części',
            quantity: data.quantity || 0,
            minStock: data.minStock || 0,
            unit: data.unit || 'szt.',
            purchasePrice: data.purchasePrice || 0,
            sellPrice: data.sellPrice || 0
          });
          setInitialLoading(false);
        })
        .catch(err => {
          console.error(err);
          showAlert('Błąd podczas wczytywania towaru.');
          router.push('/products');
        });
    }
  }, [id, router, showAlert]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = id ? `/api/products/${id}` : '/api/products';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        router.push('/products');
      } else {
        await showAlert('Błąd podczas zapisywania towaru.');
      }
    } catch (err) {
      console.error(err);
      await showAlert('Wystąpił błąd.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>Ładowanie danych...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 className="page-title">{id ? 'Edytuj towar / usługę' : 'Nowy towar / usługa'}</h1>
        <p className="page-subtitle">Wypełnij dane, aby zapisać pozycję w katalogu</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Dane podstawowe</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Nazwa towaru/usługi *</label>
              <input required type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label>SKU / Kod kreskowy *</label>
              <input required type="text" name="itemCode" className="form-input" value={formData.itemCode} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label>Kategoria</label>
              <TagSelector 
                entity="product_category" 
                name="category" 
                value={formData.category} 
                onChange={handleChange as any} 
              />
            </div>

            <div className="form-group">
              <label>Cena zakupu netto (PLN)</label>
              <input type="number" step="0.01" name="purchasePrice" className="form-input" value={formData.purchasePrice} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label>Cena sprzedaży netto (PLN) *</label>
              <input required type="number" step="0.01" name="sellPrice" className="form-input" value={formData.sellPrice} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Obecny stan magazynowy</label>
              <input type="number" step="0.01" name="quantity" className="form-input" value={formData.quantity} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label>Minimalny stan (Alert)</label>
              <input type="number" step="0.01" name="minStock" className="form-input" value={formData.minStock} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Jednostka</label>
              <CustomSelect 
                name="unit" 
                className="form-input" 
                value={formData.unit} 
                onChange={handleChange}
                options={[
                  { value: "szt.", label: "szt." },
                  { value: "l", label: "litr" },
                  { value: "kg", label: "kg" },
                  { value: "kpl", label: "komplet" }
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.push('/products')}>
              Anuluj
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zapisz towar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function ProductFormPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>Ładowanie...</div>}>
      <ProductForm />
    </Suspense>
  );
}
