import Link from 'next/link';
import { getZleceniaSzczegolowe, getKasaRaport, getKlienciZlecenia, getMagazynPrzyjecia, getMagazynStan, getZleceniaCzasPracy, getPracownicyRozliczenie, getPracownicySzczegoloweRozliczenie, getPracownicyRaportCzasuPracy, getPracownicyPorownanieCzasu, getPracownicySzczegolowyRaportCzasu, getGenericReport } from '@/app/reports/data-fetchers';
import ReportTable from '@/components/ReportTable';

export default async function ReportPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || 'zestawienie';
  
  let dataList: any[] = [];
  let columns: string[] = [];

  
    if (activeTab === 'zestawienie') {
      columns = ["Lp","Nazwa","Ilość","Jedn.","Koszt","Przychód","Zysk"];
      dataList = await getGenericReport('Szczegółowe zestawienie sprzedaży', ["Lp","Nazwa","Ilość","Jedn.","Koszt","Przychód","Zysk"]);
    }
    if (activeTab === 'dokumenty') {
      columns = ["Lp","Numer dokumentu","NIP klienta","Data wyst.","Data sprz.","Termin płatnościmetoda płatności","Zapłacono","Do zapłaty","Razem"];
      dataList = await getGenericReport('Zestawienie dokumentów', ["Lp","Numer dokumentu","NIP klienta","Data wyst.","Data sprz.","Termin płatnościmetoda płatności","Zapłacono","Do zapłaty","Razem"]);
    }
    if (activeTab === 'wz') {
      columns = ["Lp.","Rodzaj dokumentu","Nr dokumentu sprzedaży","Data dokumentu sprzedaży","Wartość netto pozycji towarowych sprzedaży","Nr dokumentu WZ","Data dokumentu WZ","Koszt zakupu"];
      dataList = await getGenericReport('Zestawienie dokumentów WZ do sprzedaży', ["Lp.","Rodzaj dokumentu","Nr dokumentu sprzedaży","Data dokumentu sprzedaży","Wartość netto pozycji towarowych sprzedaży","Nr dokumentu WZ","Data dokumentu WZ","Koszt zakupu"]);
    }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-2xl)' }}>
      {/* Breadcrumbs */}
      <div style={{ marginBottom: 'var(--space-lg)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <Link href="/reports" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Raporty</Link>
        {' > '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          Raport sprzedaży
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Raport sprzedaży</h1>
          <p className="page-subtitle">Dokumenty i zestawienia</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border)', 
        overflowX: 'auto',
        marginBottom: 'var(--space-xl)' 
      }}>
        {[{"id":"zestawienie","name":"Szczegółowe zestawienie sprzedaży","excel":"Sprzedaż - Szczegółowe zestawienie sprzedaży - 2026-05-31 19_55.xlsx"},{"id":"dokumenty","name":"Zestawienie dokumentów","excel":"Sprzedaż - Zestawienie dokumentów - 2026-05-31 19_55.xlsx"},{"id":"wz","name":"Zestawienie dokumentów WZ do sprzedaży","excel":"Sprzedaż - Zestawienie dokumentów WZ do sprzedaży - 2026-05-31 19_55.xlsx"}].map(tab => {
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
