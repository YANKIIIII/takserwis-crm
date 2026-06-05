'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CustomSelect } from '@/components/CustomSelect';
import { useDialog } from '@/contexts/DialogContext';

type Product = {
  id: number;
  itemCode: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  purchasePrice: number;
  sellPrice: number;
};

export default function ProductsPage() {
  const router = useRouter();
  const { showAlert, showConfirm } = useDialog();
  const [products, setProducts] = useState<Product[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const loadProductsAndTags = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/tags?entity=product_category').then(res => res.json())
    ]).then(([productsData, tagsData]) => {
      setProducts(productsData);
      setTags(tagsData);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadProductsAndTags();
  }, []);

  const handleDelete = async (id: number) => {
    if (await showConfirm('Czy na pewno chcesz usunąć ten towar?')) {
      try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
          loadProductsAndTags();
        } else {
          await showAlert('Błąd podczas usuwania.');
        }
      } catch (err) {
        console.error(err);
        await showAlert('Wystąpił błąd.');
      }
    }
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const filtered = products.filter(p =>
    (category === 'all' || p.category === category) &&
    `${p.name} ${p.itemCode}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Towary</h1><p className="page-subtitle">Katalog części i materiałów</p></div>
        <button className="btn btn-primary" onClick={() => router.push('/products/form')}>+ Dodaj towar</button>
      </div>
      
      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1 }}>
          <svg className="search-bar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="form-input" placeholder="Szukaj towaru..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <CustomSelect 
          name="category"
          value={category} 
          onChange={e => setCategory(e.target.value)} 
          style={{ minWidth: 160, width: 160 }}
          options={categories.map(c => ({ value: c, label: c === 'all' ? 'Wszystkie kategorie' : c }))}
        />
      </div>
      
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nazwa</th>
              <th>SKU</th>
              <th>Kategoria</th>
              <th>Cena netto</th>
              <th>Stan</th>
              <th>Status</th>
              <th style={{ width: '100px', textAlign: 'right' }}>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>Ładowanie danych...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>Brak produktów do wyświetlenia</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.name}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.itemCode}</td>
                <td>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', padding: '3px 10px', 
                    borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600,
                    backgroundColor: tags.find(t => t.name === p.category)?.color ? `${tags.find(t => t.name === p.category)?.color}26` : 'var(--secondary-bg)',
                    color: tags.find(t => t.name === p.category)?.color || 'var(--secondary)',
                    border: `1px solid ${tags.find(t => t.name === p.category)?.color ? tags.find(t => t.name === p.category)?.color + '40' : 'var(--secondary-border)'}`
                  }}>
                    {p.category}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.sellPrice.toLocaleString('pl-PL')} zł</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{p.quantity} {p.unit}</td>
                <td><span className={`badge ${p.quantity <= p.minStock ? 'badge-pending' : 'badge-done'}`}><span className="badge-dot"/>{p.quantity <= p.minStock ? 'Niski stan' : 'OK'}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => router.push(`/products/form?id=${p.id}`)}>Edytuj</button>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--red)' }} onClick={() => handleDelete(p.id)}>Usuń</button>
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
