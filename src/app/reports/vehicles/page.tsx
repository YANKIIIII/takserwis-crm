import Link from 'next/link';
import { getZleceniaSzczegolowe, getKasaRaport, getKlienciZlecenia, getMagazynPrzyjecia, getMagazynStan, getZleceniaCzasPracy, getPracownicyRozliczenie, getPracownicySzczegoloweRozliczenie, getPracownicyRaportCzasuPracy, getPracownicyPorownanieCzasu, getPracownicySzczegolowyRaportCzasu, getGenericReport } from '@/app/reports/data-fetchers';
import ReportTable from '@/components/ReportTable';

export default async function ReportPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || 'historia';
  
  let dataList: any[] = [];
  let columns: string[] = [];

  
    if (activeTab === 'historia') {
      columns = ["Data","Zlecenie","Pojazd","Opis"];
      dataList = await getGenericReport('Historia pojazdu', ["Data","Zlecenie","Pojazd","Opis"]);
    }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-2xl)' }}>
      {/* Breadcrumbs */}
      <div style={{ marginBottom: 'var(--space-lg)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <Link href="/reports" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Raporty</Link>
        {' > '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          Raport pojazdów
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Raport pojazdów</h1>
          <p className="page-subtitle">Historia i wizyty</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border)', 
        overflowX: 'auto',
        marginBottom: 'var(--space-xl)' 
      }}>
        {[{"id":"historia","name":"Historia pojazdu","excel":"Pojazdy - Historia pojazdu - 2026-05-31 19_58.xlsx"}].map(tab => {
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
