import Link from 'next/link';
import { getZleceniaSzczegolowe, getKasaRaport, getKlienciZlecenia, getMagazynPrzyjecia, getMagazynStan, getZleceniaCzasPracy, getPracownicyRozliczenie, getPracownicySzczegoloweRozliczenie, getPracownicyRaportCzasuPracy, getPracownicyPorownanieCzasu, getPracownicySzczegolowyRaportCzasu, getGenericReport } from '@/app/reports/data-fetchers';
import ReportTable from '@/components/ReportTable';

export default async function ReportPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || 'przyjecia';
  
  let dataList: any[] = [];
  let columns: string[] = [];

  
    if (activeTab === 'przyjecia') {
      columns = ["Lp","Nazwa","Kod towaru","Data","Przyjęto","Wydano","Pozostało"];
      dataList = await getMagazynPrzyjecia();
    }
    if (activeTab === 'rezerwacje') {
      columns = ["Lp","Rezerwacja","Zlecenie","Nazwa","Kod","Ilość","Cena","Wartość","Utworzony","Zrealizowany"];
      dataList = await getGenericReport('Rezerwacje towarów', ["Lp","Rezerwacja","Zlecenie","Nazwa","Kod","Ilość","Cena","Wartość","Utworzony","Zrealizowany"]);
    }
    if (activeTab === 'ruchy') {
      columns = ["Kod towaru","Nazwa","Data","Dokument","Cena","Zmiana"];
      dataList = await getGenericReport('Ruchy magazynowe towarów', ["Kod towaru","Nazwa","Data","Dokument","Cena","Zmiana"]);
    }
    if (activeTab === 'spis') {
      columns = ["Lp","Nazwa","Kod towaru","Stan","Cena","Wartość"];
      dataList = await getGenericReport('Spis z natury', ["Lp","Nazwa","Kod towaru","Stan","Cena","Wartość"]);
    }
    if (activeTab === 'stan') {
      columns = ["Lp","Nazwa","Kod towaru","Jend.","Stan","Rezerwacja","Dostępne"];
      dataList = await getMagazynStan();
    }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-2xl)' }}>
      {/* Breadcrumbs */}
      <div style={{ marginBottom: 'var(--space-lg)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <Link href="/reports" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Raporty</Link>
        {' > '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          Raport magazynu
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Raport magazynu</h1>
          <p className="page-subtitle">Stany i ruchy magazynowe</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border)', 
        overflowX: 'auto',
        marginBottom: 'var(--space-xl)' 
      }}>
        {[{"id":"przyjecia","name":"Przyjęcia towarów","excel":"Magazyn - Przyjęcia towarów - 2026-05-31 19_59.xlsx"},{"id":"rezerwacje","name":"Rezerwacje towarów","excel":"Magazyn - Rezerwacje towarów - 2026-05-31 19_59.xlsx"},{"id":"ruchy","name":"Ruchy magazynowe towarów","excel":"Magazyn - Ruchy magazynowe towarów - 2026-05-31 19_59.xlsx"},{"id":"spis","name":"Spis z natury","excel":"Magazyn - Spis z natury - 2026-05-31 19_58.xlsx"},{"id":"stan","name":"Stan magazynu","excel":"Magazyn - Stan magazynu - 2026-05-31 19_59.xlsx"}].map(tab => {
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
