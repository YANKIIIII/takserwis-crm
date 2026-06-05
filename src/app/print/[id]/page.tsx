'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

interface OrderItem {
  id: number;
  name: string;
  type: string;
  quantity: number;
  unitPrice: number;
}

interface WorkOrderDetail {
  id: number;
  status: string;
  description: string | null;
  totalAmount: number;
  createdAt: string;
  completedAt: string | null;
  returnParts: boolean;
  testDrive: boolean;
  registrationCert: boolean;
  fillFluids: boolean;
  fillLights: boolean;
  vehicle: {
    brand: string;
    model: string;
    plate: string;
    vin: string | null;
    mileage: number | null;
    customer: { firstName: string; lastName: string; phone: string; email: string | null; street: string | null; city: string | null; postalCode: string | null; country: string | null; };
  };
  mechanic: { name: string; specialization: string | null } | null;
  items: OrderItem[];
}

const statusMap: Record<string, string> = {
  pending: 'Oczekuje',
  in_progress: 'W trakcie',
  done: 'Gotowy do odbioru',
};

const DocIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const CarDamagePlaceholder = () => (
  <div style={{ position: 'relative', width: '240px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <img src="/cars.png" alt="Szkic pojazdu" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
  </div>
);

// --- Shared Document Header ---
const DocumentHeader = ({ displayId, formattedDate, status }: { displayId: string, formattedDate: string, status: string }) => {
  return (
    <div style={{ display: 'flex', padding: '10px 0', marginBottom: '15px', alignItems: 'center' }}>
      <div style={{ width: '220px' }}>
        <img src="/images/logo.svg" alt="Tak Serwis Logo" style={{ maxWidth: '100%', maxHeight: '48px', objectFit: 'contain' }} />
      </div>

      <div style={{ flex: 1, textAlign: 'center', fontSize: '10px' }}>
        <div style={{ color: '#555', marginBottom: '2px' }}>Administratorem danych osobowych jest:</div>
        <div style={{ fontSize: '13px', textTransform: 'uppercase', lineHeight: '1.2', marginBottom: '4px' }}>
          TAK SERVICE SPÓŁKA Z OGRANICZONĄ<br/>ODPOWIEDZIALNOŚCIĄ
        </div>
        <div><strong>ul. Składowa 33, 62-081 Przeźmierowo</strong></div>
        <div><strong>NIP:</strong> 7831866906 &nbsp; <strong>Telefon:</strong> 664040599</div>
      </div>

      <div style={{ width: '220px', textAlign: 'right', fontSize: '11px' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '6px' }}>{displayId}</div>
        <div style={{ marginBottom: '4px' }}><strong>Data utworzenia:</strong> {formattedDate}</div>
        <div>
          <strong>Status:</strong>
          <span style={{ 
            display: 'inline-block',
            background: '#666', color: '#fff', 
            padding: '2px 8px', borderRadius: '10px', 
            fontSize: '10px', marginLeft: '6px'
          }}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Shared Customer/Vehicle Data ---
const CustomerVehicleData = ({ order }: { order: WorkOrderDetail }) => (
  <div className="avoid-break" style={{ display: 'flex', border: '1px solid #ccc', marginBottom: '20px', borderRadius: '4px', overflow: 'hidden' }}>
    <div style={{ flex: 1, borderRight: '1px solid #ccc' }}>
      <div style={{ background: '#f5f5f5', padding: '8px 15px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', textTransform: 'uppercase' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Dane klienta
      </div>
      <div style={{ padding: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', fontSize: '12px' }}>
          <div style={{ color: '#555' }}>Imię i nazwisko:</div>
          <div style={{ fontWeight: 'bold' }}>{order.vehicle.customer.firstName} {order.vehicle.customer.lastName}</div>
          <div style={{ color: '#555' }}>Numer telefonu:</div>
          <div style={{ fontWeight: 'bold' }}>{order.vehicle.customer.phone}</div>
          <div style={{ color: '#555' }}>Adres:</div>
          <div style={{ fontWeight: 'bold' }}>{order.vehicle.customer.street ? `${order.vehicle.customer.street}, ${order.vehicle.customer.city}` : 'Brak danych'}</div>
        </div>
      </div>
    </div>
    
    <div style={{ flex: 1 }}>
      <div style={{ background: '#f5f5f5', padding: '8px 15px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', textTransform: 'uppercase' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
          <path d="M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-6 0H9" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
        Dane pojazdu
      </div>
      <div style={{ padding: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', fontSize: '12px' }}>
          <div style={{ color: '#555' }}>Marka i model:</div>
          <div style={{ fontWeight: 'bold' }}>{order.vehicle.brand} {order.vehicle.model}</div>
          <div style={{ color: '#555' }}>Nr rejestracyjny:</div>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{order.vehicle.plate}</div>
          <div style={{ color: '#555' }}>Numer VIN:</div>
          <div style={{ fontWeight: 'bold' }}>{order.vehicle.vin || '---'}</div>
          <div style={{ color: '#555' }}>Stan licznika:</div>
          <div style={{ fontWeight: 'bold' }}>{order.vehicle.mileage ? `${order.vehicle.mileage} km` : '---'}</div>
          <div style={{ color: '#555' }}>Poziom paliwa:</div>
          <div style={{ fontWeight: 'bold' }}>---</div>
        </div>
      </div>
    </div>
  </div>
);

function PrintAcceptance({ order }: { order: WorkOrderDetail }) {
  const d = new Date(order.createdAt);
  const formattedDate = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  const displayId = `ZL${order.id}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  const now = new Date();
  const printDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth()+1).toString().padStart(2, '0')}.${now.getFullYear().toString().slice(2)}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="print-doc" style={{ color: '#000', fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.4' }}>
      
      {/* Top Bar Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0', fontWeight: 'bold' }}>
        <div>{printDate}</div>
        <div>{displayId}</div>
      </div>

      <DocumentHeader displayId={displayId} formattedDate={formattedDate} status={statusMap[order.status] || 'Oczekuje'} />
      <CustomerVehicleData order={order} />

      {/* Main Protocol Box */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px' }}>
        <tbody>
          {/* Box Header */}
          <tr className="avoid-break">
            <td style={{ padding: '10px 15px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}><DocIcon /> Protokół przyjęcia</div>
            </td>
          </tr>

          {/* Opis uszkodzeń / Dodatkowe info */}
          <tr className="avoid-break">
            <td style={{ padding: '10px 15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '30px', boxSizing: 'border-box' }}>
                <div>
                  <div style={{ marginBottom: '5px' }}>Opis uszkodzeń:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '200px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="/cars.png" alt="Szkic pojazdu" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center', color: '#000', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', fontSize: '11px', wordWrap: 'break-word' }}>
                      Brak adnotacji<br/>o<br/>uszkodzeniach
                    </div>
                  </div>
                </div>
                
                <div>
                  <div style={{ marginBottom: '10px' }}>Dodatkowe informacje:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { label: 'Zwrot części do klienta', val: order.returnParts },
                      { label: 'Jazda testowa', val: order.testDrive },
                      { label: 'Dowód rejestracyjny', val: order.registrationCert },
                      { label: 'Uzupełnić płyny', val: order.fillFluids },
                      { label: 'Uzupełnić oświetlenie', val: order.fillLights }
                    ].map(({ label, val }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '4px', alignItems: 'center' }}>
                        <span style={{ paddingRight: '5px' }}>{label}</span>
                        <span style={{ color: '#000', fontSize: '11px', fontWeight: 'bold', minWidth: '45px', textAlign: 'right', flexShrink: 0 }}>
                          {val ? '☑ TAK' : '☐ NIE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </td>
          </tr>

          {/* ZAKAZ WSTĘPU */}
          <tr className="avoid-break">
            <td style={{ padding: '8px 15px', borderTop: '1px solid #ccc', textAlign: 'justify', lineHeight: '1.4' }}>
              W celu zapewnienia bezpieczeństwa klientów i pracowników jest <strong>ZAKAZ WSTĘPU</strong> do strefy napraw. Klientom nie wolno przebywać na terenie strefy napraw przez cały czas trwania prac serwisowych. Wszelkie pytania, dotyczące stanu pojazdu lub przebiegu naprawy, mogą być skierowane do odpowiedzialnego pracownika serwisu samochodowego.
            </td>
          </tr>

          {/* RODO / Dane osobowe */}
          <tr className="avoid-break">
            <td style={{ padding: '8px 15px', borderTop: '1px solid #ccc', fontSize: '7px', color: '#000', textAlign: 'justify', lineHeight: '1.2' }}>
              <strong>Dane osobowe</strong><br/>
              Administratorem Państwa danych osobowych i sposobu kontaktu z nim określono na wstępie karty zlecenia. Podanie danych jest konieczne dla realizacji zamówienia. Administrator może przetwarzać te dane (w szczególności: imię i nazwisko, adres, NIP, PESEL, REGON, nr telefonu, adres e-mail, dane dotyczące wykonanych dla Państwa usług i informacje o Państwa płatnościach):<br/>
              a) na podstawie zawartej z Państwem umowy o wykonanie zamówienia w celu jej wykonywania, a także rozwiązania - przez okres obowiązywania umowy,<br/>
              b) na podstawie prawnie uzasadnionych interesów administratora w celu ewentualnego dochodzenia roszczeń związanych z umową i upłynięcia okresu przedawnienia,<br/>
              c) na podstawie ciążącego na administratorze obowiązku prawnego przechowywania danych wynikającego z Ordynacji podatkowej i ustawy o rachunkowości - przez okresy wskazane w tych ustawach.<br/>
              Osoby, których dane osobowe administrator przetwarza, mają prawo do dostępu do tych danych, ich sprostowania, usunięcia lub ograniczenia ich przetwarzania, wniesienia sprzeciwu wobec ich przetwarzania, ich przeniesienia, a także do skargi do Prezesa Urzędu Ochrony Danych Osobowych.
            </td>
          </tr>

          <tr className="avoid-break">
            <td style={{ padding: 0, borderTop: '1px solid #ccc' }}>
              <div style={{ padding: '8px 15px', fontSize: '7px', color: '#000', textAlign: 'justify', lineHeight: '1.2' }}>
                <strong>Prawo zatrzymania</strong><br/>
                Informujemy, że zgodnie z art. 461 Kodeksu cywilnego przysługuje nam prawo zatrzymania pojazdu i innych powierzonych nam rzeczy do chwili zaspokojenia lub zabezpieczenia przysługujących nam roszczeń o zwrot nakładów na te rzeczy lub o naprawienie szkody przez nie wyrządzonej.
              </div>

              {/* Signatures */}
              <div style={{ padding: '10px 15px', display: 'flex', justifyContent: 'space-around', paddingTop: '40px', paddingBottom: '10px' }}>
                <div style={{ width: '250px', borderTop: '1px solid #999', textAlign: 'center', paddingTop: '5px' }}>
                  Osoba uprawniona do wystawienia dokumentu
                </div>
                <div style={{ width: '250px', borderTop: '1px solid #999', textAlign: 'center', paddingTop: '5px' }}>
                  Podpis klienta
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  );
}

// Fallbacks for the other document types using the same exact layout structure

function PrintDelivery({ order }: { order: WorkOrderDetail }) {
  const d = new Date(order.createdAt);
  const formattedDate = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  const displayId = `ZL${order.id}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  const now = new Date();
  const printDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth()+1).toString().padStart(2, '0')}.${now.getFullYear().toString().slice(2)}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="print-doc" style={{ color: '#000', fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.4' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0', fontWeight: 'bold' }}>
        <div>{printDate}</div>
        <div>{displayId}</div>
      </div>
      <DocumentHeader displayId={displayId} formattedDate={formattedDate} status="Wydany" />
      <CustomerVehicleData order={order} />

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px' }}>
        <tbody>
          <tr className="avoid-break">
            <td style={{ padding: '10px 15px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}><DocIcon /> Protokół wydania</div>
            </td>
          </tr>
          <tr className="avoid-break">
            <td style={{ padding: '15px' }}>
              <table className="content-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left', width: '40px' }}>Lp.</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Nazwa towaru / usługi</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', width: '80px' }}>Ilość</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.length > 0 ? order.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.name}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} style={{ padding: '20px', textAlign: 'center' }}>Brak przypisanych pozycji w systemie.</td></tr>
                  )}
                </tbody>
              </table>
            </td>
          </tr>
          <tr className="avoid-break">
            <td style={{ padding: 0, borderTop: '1px solid #ccc' }}>
              <div style={{ padding: '15px', textAlign: 'justify', lineHeight: '1.5' }}>
                <strong>Oświadczenie klienta:</strong><br/>
                Potwierdzam odbiór pojazdu po naprawie. Oświadczam, że pojazd został mi wydany w stanie pozwalającym na bezpieczne uczestnictwo w ruchu drogowym. Nie wnoszę uwag do jakości wykonanych usług, czystości pojazdu ani kompletności jego wyposażenia.
              </div>
              <div style={{ padding: '10px 15px', display: 'flex', justifyContent: 'space-around', paddingTop: '40px', paddingBottom: '10px' }}>
                <div style={{ width: '250px', borderTop: '1px solid #999', textAlign: 'center', paddingTop: '5px' }}>Osoba uprawniona do wydania</div>
                <div style={{ width: '250px', borderTop: '1px solid #999', textAlign: 'center', paddingTop: '5px' }}>Podpis klienta</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PrintWorkOrder({ order }: { order: WorkOrderDetail }) {
  const d = new Date(order.createdAt);
  const formattedDate = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  const displayId = `ZL${order.id}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  const now = new Date();
  const printDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth()+1).toString().padStart(2, '0')}.${now.getFullYear().toString().slice(2)}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="print-doc" style={{ color: '#000', fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.4' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0', fontWeight: 'bold' }}>
        <div>{printDate}</div>
        <div>{displayId}</div>
      </div>
      <DocumentHeader displayId={displayId} formattedDate={formattedDate} status="Oczekuje" />

      <div style={{ display: 'flex', border: '1px solid #ccc', marginBottom: '15px', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ flex: 1, borderRight: '1px solid #ccc' }}>
          <div style={{ background: '#f5f5f5', padding: '8px 15px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', textTransform: 'uppercase' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <path d="M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-6 0H9" />
              <circle cx="7" cy="17" r="2" />
              <circle cx="17" cy="17" r="2" />
            </svg>
            Pojazd
          </div>
          <div style={{ padding: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '10px', fontSize: '12px' }}>
              <div style={{ color: '#555' }}>Marka i model:</div>
              <div style={{ fontWeight: 'bold' }}>{order.vehicle.brand} {order.vehicle.model}</div>
              <div style={{ color: '#555' }}>Numer rejestracyjny:</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{order.vehicle.plate}</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ background: '#f5f5f5', padding: '8px 15px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', textTransform: 'uppercase' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            Zlecenie
          </div>
          <div style={{ padding: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '10px', fontSize: '12px' }}>
              <div style={{ color: '#555' }}>Mechanik:</div>
              <div style={{ fontWeight: 'bold' }}>{order.mechanic?.name || 'Nieprzypisany'}</div>
              <div style={{ color: '#555' }}>Numer VIN:</div>
              <div style={{ fontWeight: 'bold' }}>{order.vehicle.vin || '---'}</div>
            </div>
          </div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px', minHeight: '120px' }}>
        <tbody>
          <tr className="avoid-break">
            <td style={{ padding: '10px 15px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}><DocIcon /> Zgłoszone usterki / Opis</div>
            </td>
          </tr>
          
          <tr className="avoid-break">
            <td style={{ padding: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '30px', boxSizing: 'border-box' }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {order.description || 'Brak opisu zlecenia.'}
                </div>

                <div>
                  <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Dodatkowe informacje:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { label: 'Zwrot części do klienta', val: order.returnParts },
                      { label: 'Jazda testowa', val: order.testDrive },
                      { label: 'Dowód rejestracyjny', val: order.registrationCert },
                      { label: 'Uzupełnić płyny', val: order.fillFluids },
                      { label: 'Uzupełnić oświetlenie', val: order.fillLights }
                    ].map(({ label, val }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '4px', alignItems: 'center' }}>
                        <span style={{ paddingRight: '5px' }}>{label}</span>
                        <span style={{ color: '#000', fontSize: '11px', fontWeight: 'bold', minWidth: '45px', textAlign: 'right', flexShrink: 0 }}>
                          {val ? '☑ TAK' : '☐ NIE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PrintReceipt({ order }: { order: WorkOrderDetail }) {
  const d = new Date(order.createdAt);
  const formattedDate = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  const displayId = `ZL${order.id}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  const now = new Date();
  const printDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth()+1).toString().padStart(2, '0')}.${now.getFullYear().toString().slice(2)}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="print-doc" style={{ color: '#000', fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.4' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0', fontWeight: 'bold' }}>
        <div>{printDate}</div>
        <div>{displayId}</div>
      </div>
      <DocumentHeader displayId={displayId} formattedDate={formattedDate} status="Zakończone" />

      <div style={{ display: 'flex', border: '1px solid #ccc', marginBottom: '15px', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ flex: 1, borderRight: '1px solid #ccc' }}>
          <div style={{ background: '#f5f5f5', padding: '8px 15px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', textTransform: 'uppercase' }}>
            Nabywca
          </div>
          <div style={{ padding: '15px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>{order.vehicle.customer.firstName} {order.vehicle.customer.lastName}</div>
            <div style={{ color: '#555' }}>{order.vehicle.customer.street ? `${order.vehicle.customer.street}, ${order.vehicle.customer.city}` : 'Brak adresu'}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ background: '#f5f5f5', padding: '8px 15px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', textTransform: 'uppercase' }}>
            Dotyczy pojazdu
          </div>
          <div style={{ padding: '15px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>{order.vehicle.brand} {order.vehicle.model} ({order.vehicle.plate})</div>
            <div style={{ color: '#555' }}>VIN: {order.vehicle.vin || '---'}</div>
          </div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '20px' }}>
        <tbody>
          <tr className="avoid-break">
            <td style={{ padding: '10px 15px', borderBottom: '1px solid #ccc', fontWeight: 'bold', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}><DocIcon /> Kosztorys</div>
            </td>
          </tr>
          <tr className="avoid-break">
            <td style={{ padding: '15px' }}>
              <table className="content-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left', width: '40px' }}>Lp.</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Nazwa towaru / usługi</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', width: '60px' }}>Ilość</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '100px' }}>Cena jedn.</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', width: '100px' }}>Wartość</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.length > 0 ? order.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.name}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{item.unitPrice.toLocaleString('pl-PL')} zł</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{(item.quantity * item.unitPrice).toLocaleString('pl-PL')} zł</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>Brak pozycji na zleceniu</td></tr>
                  )}
                </tbody>
              </table>
            </td>
          </tr>
          <tr className="avoid-break">
            <td style={{ padding: '15px', borderTop: '1px solid #ccc' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '300px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>Suma netto:</span>
                    <span>{(order.totalAmount / 1.23).toFixed(2).replace('.', ',')} zł</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #ccc', marginBottom: '10px' }}>
                    <span>VAT (23%):</span>
                    <span>{(order.totalAmount - (order.totalAmount / 1.23)).toFixed(2).replace('.', ',')} zł</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>RAZEM:</span>
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{order.totalAmount.toLocaleString('pl-PL')} zł</span>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function PrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const type = searchParams.get('type') || 'acceptance';
  
  const [order, setOrder] = useState<WorkOrderDetail | null>(null);

  const loadOrder = useCallback(() => {
    fetch(`/api/work-orders/${id}`)
      .then((r) => r.json())
      .then(data => {
        setOrder(data);
        setTimeout(() => {
          window.print();
        }, 800);
      });
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (!order) {
    return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>Trwa generowanie dokumentu...</div>;
  }

  return (
    <div style={{ padding: '0', background: '#fff', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}} />

      <div className="no-print" style={{ 
        padding: '15px 20px', background: '#fff3cd', borderBottom: '1px solid #ffeeba', 
        color: '#856404', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div>
          <strong style={{ marginRight: '10px' }}>Tryb drukowania dokumentu.</strong>
          Jeśli okno drukowania nie pojawiło się automatycznie, wciśnij <kbd style={{ background: '#fff', border: '1px solid #ccc', padding: '2px 6px', borderRadius: '4px' }}>Ctrl + P</kbd>.
        </div>
        <button onClick={() => window.close()} style={{ background: '#fff', border: '1px solid #ccc', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>✕ Zamknij podgląd</button>
      </div>

      <div style={{ padding: '15mm', maxWidth: '210mm', margin: '0 auto', boxSizing: 'border-box' }}>
        {type === 'acceptance' && <PrintAcceptance order={order} />}
        {type === 'delivery' && <PrintDelivery order={order} />}
        {type === 'order' && <PrintWorkOrder order={order} />}
        {type === 'receipt' && <PrintReceipt order={order} />}
      </div>
    </div>
  );
}
