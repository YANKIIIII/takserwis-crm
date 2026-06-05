import Link from 'next/link';
import { getZleceniaSzczegolowe, getKasaRaport, getKlienciZlecenia, getMagazynPrzyjecia, getMagazynStan, getZleceniaCzasPracy, getPracownicyRozliczenie, getPracownicySzczegoloweRozliczenie, getPracownicyRaportCzasuPracy, getPracownicyPorownanieCzasu, getPracownicySzczegolowyRaportCzasu, getGenericReport } from '@/app/reports/data-fetchers';
import ReportTable from '@/components/ReportTable';

export default async function ReportPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || 'czas';
  
  let dataList: any[] = [];
  let columns: string[] = [];

  
    if (activeTab === 'czas') {
      columns = ["Data","Serhii Maliarenko","Paweł Adamowicz","Vasyl Mendryshora","Marcin Kuczyński","Andrii Yermakov"];
      dataList = await getPracownicyRaportCzasuPracy();
    }
    if (activeTab === 'porownanie') {
      columns = ["Pracownik","Nazwa","Rozpoczęcie","Zakończenie","Szac. czas","Przepr. czas","Różnica"];
      dataList = await getPracownicyPorownanieCzasu();
    }
    if (activeTab === 'rozliczenie') {
      columns = ["Data","Serhii Maliarenko","Paweł Adamowicz","Vasyl Mendryshora","Marcin Kuczyński","Andrii Yermakov"];
      dataList = await getPracownicyRozliczenie();
    }
    if (activeTab === 'rozliczenie_szczegoly') {
      columns = ["Zlecenie","Zadanie","Wartość zadania","Wartość rozliczenia"];
      dataList = await getPracownicySzczegoloweRozliczenie();
    }
    if (activeTab === 'czas_szczegoly') {
      columns = ["Przepr. czas","Wartość netto","Wartość brutto"];
      dataList = await getPracownicySzczegolowyRaportCzasu();
    }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-2xl)' }}>
      {/* Breadcrumbs */}
      <div style={{ marginBottom: 'var(--space-lg)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <Link href="/reports" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Raporty</Link>
        {' > '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          Raport pracowników
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Raport pracowników</h1>
          <p className="page-subtitle">Czas pracy i rozliczenia</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border)', 
        overflowX: 'auto',
        marginBottom: 'var(--space-xl)' 
      }}>
        {[{"id":"czas","name":"Raport czasu pracy","excel":"Pracownicy - Raport czasu pracy - 2026-05-31 19_56.xlsx"},{"id":"porownanie","name":"Porównanie szacowanego i rzeczywistego czasu pracy","excel":"Pracownicy - Porównanie szacowanego i rzeczywistego czasu pracy - 2026-05-31 19_57.xlsx"},{"id":"rozliczenie","name":"Rozliczenie pracowników","excel":"Pracownicy - Rozliczenie pracowników - 2026-05-31 19_56.xlsx"},{"id":"rozliczenie_szczegoly","name":"Szczegółowe rozliczenie pracowników","excel":"Pracownicy - Szczegółowe rozliczenie pracowników - 2026-05-31 19_56.xlsx"},{"id":"czas_szczegoly","name":"Szczegółowy raport rzeczywistego czasu pracy","excel":"Pracownicy - Szczegółowy raport rzeczywistego czasu pracy - 2026-05-31 19_56.xlsx"}].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`?tab=${tab.id}`}
              style={{
                padding: '12px 24px',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--orange)' : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                textDecoration: 'none'
              }}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>

      <ReportTable columns={columns} dataList={dataList} />
    </div>
  );
}
