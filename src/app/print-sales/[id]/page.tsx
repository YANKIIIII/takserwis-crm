'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface DocumentItem {
  id: number;
  itemCode: string;
  name: string;
  quantity: number;
  price: number;
}

interface WarehouseDocument {
  id: number;
  type: string;
  documentNumber: string;
  date: string;
  contractorName: string | null;
  status: string;
  totalValue: number;
  items: DocumentItem[];
}

export default function PrintSalesPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [doc, setDoc] = useState<WarehouseDocument | null>(null);

  const loadDoc = useCallback(() => {
    fetch(`/api/warehouse/documents/${id}`)
      .then((r) => r.json())
      .then(data => {
        setDoc(data);
        setTimeout(() => {
          window.print();
        }, 800);
      });
  }, [id]);

  useEffect(() => {
    loadDoc();
  }, [loadDoc]);

  if (!doc) {
    return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>Trwa generowanie dokumentu...</div>;
  }

  const d = new Date(doc.date);
  const formattedDate = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  const now = new Date();
  const printDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth()+1).toString().padStart(2, '0')}.${now.getFullYear().toString().slice(2)}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const isInvoice = doc.type === 'FV';
  const isProforma = doc.type === 'PROFORMA';
  const title = isProforma ? 'Faktura Pro Forma' : (isInvoice ? 'Faktura VAT' : 'Paragon');

  return (
    <div style={{ padding: '0', background: '#fff', minHeight: '100vh', color: '#000', fontFamily: 'Arial, sans-serif' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @page { size: A4 portrait; margin: 0; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
          body { margin: 0; padding: 0; }
        }
      `}} />

      <div className="no-print" style={{ 
        padding: '15px 20px', background: '#fff3cd', borderBottom: '1px solid #ffeeba', 
        color: '#856404', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <strong style={{ marginRight: '10px' }}>Tryb drukowania.</strong>
          Jeśli okno drukowania nie pojawiło się automatycznie, wciśnij <kbd style={{ background: '#fff', border: '1px solid #ccc', padding: '2px 6px', borderRadius: '4px' }}>Ctrl + P</kbd>.
        </div>
        <button onClick={() => window.close()} style={{ background: '#fff', border: '1px solid #ccc', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>✕ Zamknij podgląd</button>
      </div>

      <div style={{ padding: '15mm', maxWidth: '210mm', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px', fontWeight: 'bold' }}>
          <div>{printDate}</div>
          <div>Dokument nr: {doc.documentNumber}</div>
        </div>

        <div style={{ display: 'flex', padding: '10px 0', marginBottom: '20px', alignItems: 'center', borderBottom: '2px solid #000' }}>
          <div style={{ width: '220px' }}>
            <img src="/images/logo.svg" alt="Tak Serwis Logo" style={{ maxWidth: '100%', maxHeight: '48px', objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center', fontSize: '10px' }}>
            <div style={{ fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>
              TAK SERVICE SPÓŁKA Z O.O.
            </div>
            <div>ul. Składowa 33, 62-081 Przeźmierowo</div>
            <div>NIP: 7831866906 | Tel: 664040599</div>
          </div>
          <div style={{ width: '220px', textAlign: 'right', fontSize: '12px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px' }}>{title}</div>
            <div style={{ marginBottom: '4px' }}><strong>Data:</strong> {formattedDate}</div>
            <div><strong>Status:</strong> {doc.status === 'paid' ? 'Zapłacono' : 'Do zapłaty'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', border: '1px solid #ccc', marginBottom: '20px', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ flex: 1, borderRight: '1px solid #ccc' }}>
            <div style={{ background: '#f5f5f5', padding: '8px 15px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}>
              Sprzedawca
            </div>
            <div style={{ padding: '15px', fontSize: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>TAK SERVICE SP. Z O.O.</div>
              <div>ul. Składowa 33, 62-081 Przeźmierowo</div>
              <div>NIP: 7831866906</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ background: '#f5f5f5', padding: '8px 15px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}>
              Nabywca
            </div>
            <div style={{ padding: '15px', fontSize: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>{doc.contractorName || 'Klient detaliczny'}</div>
              {!doc.contractorName && <div>Brak danych nabywcy</div>}
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px', fontSize: '11px' }}>
          <thead>
            <tr style={{ background: '#f9f9f9' }}>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left', width: '40px' }}>Lp.</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Nazwa towaru / usługi</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', width: '60px' }}>Ilość</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '100px' }}>Cena j. netto</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '100px' }}>Wartość netto</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((item, idx) => {
              // Obliczanie kwot netto z brutto zakladajac VAT 23%
              const unitNet = item.price / 1.23;
              const valNet = unitNet * item.quantity;
              return (
                <tr key={item.id} className="avoid-break">
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.name}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{unitNet.toFixed(2).replace('.', ',')} zł</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{valNet.toFixed(2).replace('.', ',')} zł</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="avoid-break" style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '11px' }}>
          <div style={{ width: '300px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Razem netto:</span>
              <span>{(doc.totalValue / 1.23).toFixed(2).replace('.', ',')} zł</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #ccc', marginBottom: '10px' }}>
              <span>Podatek VAT (23%):</span>
              <span>{(doc.totalValue - (doc.totalValue / 1.23)).toFixed(2).replace('.', ',')} zł</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>DO ZAPŁATY:</span>
              <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{doc.totalValue.toLocaleString('pl-PL')} zł</span>
            </div>
          </div>
        </div>

        <div className="avoid-break" style={{ display: 'flex', justifyContent: 'space-around', marginTop: '60px', fontSize: '11px' }}>
          <div style={{ width: '250px', borderTop: '1px solid #999', textAlign: 'center', paddingTop: '5px' }}>Osoba uprawniona do wystawienia</div>
          <div style={{ width: '250px', borderTop: '1px solid #999', textAlign: 'center', paddingTop: '5px' }}>Podpis osoby odbierającej</div>
        </div>

      </div>
    </div>
  );
}
