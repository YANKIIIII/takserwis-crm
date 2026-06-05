'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomSelect } from '@/components/CustomSelect';
import { useDialog } from '@/contexts/DialogContext';

function NewWarehouseDocumentForm() {
  const { showAlert } = useDialog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'PZ'; // PZ lub WZ
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [documentData, setDocumentData] = useState({
    documentNumber: '',
    date: new Date().toISOString().slice(0, 10),
    contractorName: searchParams.get('contractor') || '',
  });

  const [items, setItems] = useState<{ id: number; itemCode: string; name: string; quantity: number; price: number }[]>([
    { id: Date.now(), itemCode: '', name: '', quantity: 1, price: 0 }
  ]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentData({ ...documentData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (id: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Auto-fill name and price if itemCode is selected
        if (field === 'itemCode' && value) {
          const product = products.find(p => p.itemCode === value);
          if (product) {
            updated.name = product.name;
            updated.price = type === 'PZ' ? product.purchasePrice : product.sellPrice;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), itemCode: '', name: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      type,
      ...documentData,
      items: items.filter(i => i.itemCode && i.name && i.quantity > 0)
    };

    if (payload.items.length === 0) {
      await showAlert('Dodaj co najmniej jedną poprawną pozycję.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/warehouse/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push('/warehouse');
      } else {
        await showAlert('Błąd podczas zapisywania dokumentu.');
      }
    } catch (err) {
      console.error(err);
      await showAlert('Wystąpił błąd.');
    } finally {
      setLoading(false);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const getSubtitle = () => {
    if (type === 'PROFORMA') return 'Faktura Pro Forma (Nie zmniejsza stanu)';
    if (type === 'PZ') return 'Przyjęcie zewnętrzne (Zwiększa stan)';
    if (type === 'FV') return 'Faktura VAT (Sprzedaż - Zmniejsza stan)';
    return 'Wydanie zewnętrzne (Zmniejsza stan)';
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 className="page-title">Nowy dokument {type}</h1>
        <p className="page-subtitle">{getSubtitle()}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Dane dokumentu</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label>Numer dokumentu *</label>
              <input required type="text" name="documentNumber" className="form-input" value={documentData.documentNumber} onChange={handleDocChange} />
            </div>
            <div className="form-group">
              <label>Data *</label>
              <input required type="date" name="date" className="form-input" value={documentData.date} onChange={handleDocChange} />
            </div>
            <div className="form-group">
              <label>Kontrahent (Dostawca/Odbiorca)</label>
              <input type="text" name="contractorName" className="form-input" value={documentData.contractorName} onChange={handleDocChange} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Pozycje na dokumencie</h2>
            <button type="button" className="btn btn-secondary" onClick={addItem}>+ Dodaj wiersz</button>
          </div>

          <table className="data-table" style={{ marginBottom: 'var(--space-md)' }}>
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Towar (Wybierz z listy)</th>
                <th style={{ width: '30%' }}>Nazwa (Zostanie uzupełniona)</th>
                <th style={{ width: '15%' }}>Ilość</th>
                <th style={{ width: '15%' }}>Cena jedn. (PLN)</th>
                <th style={{ width: '10%' }}>Wartość</th>
                <th style={{ width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td>
                    <CustomSelect 
                      name="itemCode"
                      className="form-select" 
                      value={item.itemCode}
                      onChange={(e) => handleItemChange(item.id, 'itemCode', e.target.value)}
                      options={[
                        { value: "", label: "-- Wybierz towar --" },
                        ...products.map(p => ({ value: p.itemCode, label: `${p.itemCode} - ${p.name}` }))
                      ]}
                    />
                  </td>
                  <td>
                    <input type="text" className="form-input" value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} />
                  </td>
                  <td>
                    <input type="number" step="0.01" min="0.01" required className="form-input" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))} />
                  </td>
                  <td>
                    <input type="number" step="0.01" min="0" required className="form-input" value={item.price} onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value))} />
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {(item.quantity * item.price).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" onClick={() => removeItem(item.id)} style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-xl)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-lg)' }}>
            <div style={{ fontSize: '1.2rem' }}>
              Suma: <span style={{ fontWeight: 700 }}>{totalValue.toFixed(2)} PLN</span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Anuluj</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Zapisywanie...' : 'Zatwierdź dokument'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewWarehouseDocumentPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>Ładowanie...</div>}>
      <NewWarehouseDocumentForm />
    </Suspense>
  );
}
