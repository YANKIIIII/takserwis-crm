'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

export default function PrintTireStoragePage() {
  const params = useParams();
  const id = params.id as string;
  
  const [doc, setDoc] = useState<any>(null);

  const loadDoc = useCallback(() => {
    fetch(`/api/tire-storage/${id}`)
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

  const d = new Date(doc.depositDate);
  const formattedDate = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  const now = new Date();
  const printDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth()+1).toString().padStart(2, '0')}.${now.getFullYear().toString().slice(2)}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const isIssued = doc.status === 'Wydane';
  const title = isIssued ? 'Protokół wydania z przechowalni' : 'Protokół przyjęcia do przechowalni';

  return (
    <div style={{ padding: '0', background: '#fff', minHeight: '100vh', color: '#000', fontFamily: 'Arial, sans-serif' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @page { size: A4 portrait; margin: 0; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
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
          <div>Wydrukowano: {printDate}</div>
          <div>Dokument depozytu nr: {doc.id}/{d.getFullYear()}</div>
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
            <div style={{ marginBottom: '4px' }}><strong>Data przyjęcia:</strong> {formattedDate}</div>
            {isIssued && doc.returnDate && (
              <div><strong>Data wydania:</strong> {new Date(doc.returnDate).toLocaleDateString('pl-PL')}</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', border: '1px solid #ccc', marginBottom: '20px', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ flex: 1, borderRight: '1px solid #ccc' }}>
            <div style={{ background: '#f5f5f5', padding: '8px 15px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}>
              Dane Serwisu (Przechowawca)
            </div>
            <div style={{ padding: '15px', fontSize: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>TAK SERVICE SP. Z O.O.</div>
              <div>ul. Składowa 33, 62-081 Przeźmierowo</div>
              <div>NIP: 7831866906</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ background: '#f5f5f5', padding: '8px 15px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}>
              Dane Klienta (Składający)
            </div>
            <div style={{ padding: '15px', fontSize: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>{doc.customer?.firstName} {doc.customer?.lastName} {doc.customer?.companyName}</div>
              <div>Tel: {doc.customer?.phone || 'brak'}</div>
              <div>Email: {doc.customer?.email || 'brak'}</div>
              {doc.customer?.nip && <div>NIP: {doc.customer.nip}</div>}
            </div>
          </div>
        </div>

        <h4 style={{ margin: '20px 0 10px 0', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Przedmiot depozytu</h4>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '10px', width: '30%', background: '#f9f9f9', fontWeight: 'bold' }}>Pojazd</td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {doc.vehicle ? `${doc.vehicle.brand} ${doc.vehicle.model} (${doc.vehicle.plate})` : 'Brak przypisanego pojazdu'}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '10px', background: '#f9f9f9', fontWeight: 'bold' }}>Typ i Sezon</td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>{doc.type} ({doc.season})</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '10px', background: '#f9f9f9', fontWeight: 'bold' }}>Marka i model opon</td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>{doc.brandAndModel}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '10px', background: '#f9f9f9', fontWeight: 'bold' }}>Rozmiar</td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>{doc.size}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '10px', background: '#f9f9f9', fontWeight: 'bold' }}>Stan bieżnika / Uwagi o stanie</td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>{doc.treadDepth || 'Nie podano'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '10px', background: '#f9f9f9', fontWeight: 'bold' }}>Dodatkowe uwagi</td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>{doc.notes || 'Brak'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '10px', background: '#f9f9f9', fontWeight: 'bold' }}>Miejsce w magazynie</td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>{doc.storageLocation || 'Nie przypisano'}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: '11px', textAlign: 'justify', lineHeight: '1.4', marginBottom: '40px' }}>
          {isIssued ? (
            <p>
              1. Składający (Klient) potwierdza odbiór przedmiotu depozytu opisanego powyżej.<br/>
              2. Wydanie następuje po uregulowaniu ewentualnych opłat za przechowanie.<br/>
              3. Klient nie wznosi uwag co do stanu technicznego wydawanego przedmiotu depozytu.
            </p>
          ) : (
            <p>
              1. Przechowawca przyjmuje na odpłatne przechowywanie przedmiot depozytu opisany powyżej.<br/>
              2. Składający oświadcza, że przedmiot depozytu jest jego własnością i nie jest obciążony prawami osób trzecich.<br/>
              3. Serwis nie ponosi odpowiedzialności za naturalne starzenie się opon oraz uszkodzenia ukryte niemożliwe do wykrycia w chwili przyjęcia do depozytu.<br/>
              4. Wydanie przedmiotu depozytu nastąpi po zwrocie niniejszego protokołu i uregulowaniu opłaty za przechowanie.
            </p>
          )}
        </div>

        <div className="avoid-break" style={{ display: 'flex', justifyContent: 'space-around', marginTop: '60px', fontSize: '12px' }}>
          <div style={{ width: '250px', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '5px' }}>Podpis Przechowawcy (Serwis)</div>
          <div style={{ width: '250px', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '5px' }}>Podpis Składającego (Klient)</div>
        </div>

      </div>
    </div>
  );
}
