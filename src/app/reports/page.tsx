import Link from 'next/link';
import { IconTrendUp, IconTrendDown, IconDiamond, IconClipboardList } from '@/components/Icons';
import { prisma } from '@/lib/prisma';

export default async function ReportsPage() {
  // Fetch data
  const totalOrders = await prisma.workOrder.count();
  
  const doneOrders = await prisma.workOrder.findMany({
    where: { status: 'done' },
    include: { items: true }
  });

  // Calculate top services
  const serviceStats: Record<string, { count: number; revenue: number }> = {};
  
  doneOrders.forEach(order => {
    order.items.forEach(item => {
      if (item.type === 'service') {
        const itemRevenue = item.unitPrice * item.quantity * (1 - item.discount / 100);
        if (!serviceStats[item.name]) {
          serviceStats[item.name] = { count: 0, revenue: 0 };
        }
        serviceStats[item.name].count += item.quantity;
        serviceStats[item.name].revenue += itemRevenue;
      }
    });
  });

  const topServices = Object.entries(serviceStats)
    .map(([name, stats]) => ({ name, count: stats.count, revenue: stats.revenue }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // If no top services yet, provide some fallback for UI
  if (topServices.length === 0) {
    topServices.push({ name: 'Brak danych o usługach', count: 0, revenue: 0 });
  }

  // Calculate Revenue Data (last 5 months)
  const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
  
  const revenueData = [];
  const currentDate = new Date();
  
  let totalRevenue5Months = 0;
  let totalExpenses5Months = 0;

  for (let i = 4; i >= 0; i--) {
    const targetMonth = currentDate.getMonth() - i;
    const targetYear = currentDate.getFullYear() + Math.floor(targetMonth / 12);
    const normalizedMonth = (targetMonth % 12 + 12) % 12;

    const monthOrders = doneOrders.filter(order => {
      if (!order.completedAt) return false;
      const date = new Date(order.completedAt);
      return date.getMonth() === normalizedMonth && date.getFullYear() === targetYear;
    });

    const monthRevenue = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const monthExpenses = monthOrders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + (item.mechanicPay || 0), 0);
    }, 0);

    totalRevenue5Months += monthRevenue;
    totalExpenses5Months += monthExpenses;

    revenueData.push({
      month: monthNames[normalizedMonth],
      revenue: monthRevenue,
      expenses: monthExpenses
    });
  }

  const maxVal = Math.max(...revenueData.flatMap(d => [d.revenue, d.expenses]), 100); // at least 100 to avoid div by zero

  const netProfit = totalRevenue5Months - totalExpenses5Months;

  return (
    <div className="animate-fade-in">
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon green"><IconTrendUp /></div><div><div className="stat-value">{totalRevenue5Months.toLocaleString('pl-PL')} zł</div><div className="stat-label">Przychód (5 mies.)</div></div></div>
        <div className="stat-card"><div className="stat-icon red"><IconTrendDown /></div><div><div className="stat-value">{totalExpenses5Months.toLocaleString('pl-PL')} zł</div><div className="stat-label">Wydatki (5 mies.)</div></div></div>
        <div className="stat-card"><div className="stat-icon orange"><IconDiamond /></div><div><div className="stat-value">{netProfit.toLocaleString('pl-PL')} zł</div><div className="stat-label">Zysk netto</div></div></div>
        <div className="stat-card"><div className="stat-icon blue"><IconClipboardList /></div><div><div className="stat-value">{totalOrders}</div><div className="stat-label">Zleceń łącznie</div></div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Revenue vs Expenses chart */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>Przychody vs Wydatki (ostatnie 5 miesięcy)</h3>
          <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-end', height: 200 }}>
            {revenueData.map((d, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', width: '100%', justifyContent: 'center', height: 160 }}>
                  <div style={{ width: 16, background: 'var(--orange)', borderRadius: '4px 4px 0 0', height: `${(d.revenue / maxVal) * 160}px`, transition: 'height 0.4s' }} title={`Przychód: ${d.revenue.toLocaleString('pl-PL')}`}/>
                  <div style={{ width: 16, background: 'var(--border)', borderRadius: '4px 4px 0 0', height: `${(d.expenses / maxVal) * 160}px`, transition: 'height 0.4s' }} title={`Wydatki: ${d.expenses.toLocaleString('pl-PL')}`}/>
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{d.month}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', marginTop: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--orange)' }}/>Przychody</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--border)' }}/>Wydatki</div>
          </div>
        </div>

        {/* Top services */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>Najczęstsze usługi</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {topServices.map((s, i) => {
              const maxC = Math.max(...topServices.map(x => x.count), 1);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{s.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{s.count}x • {s.revenue.toLocaleString('pl-PL')} zł</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--bg-body)', borderRadius: 'var(--radius-full)' }}>
                    <div style={{ width: `${(s.count / maxC) * 100}%`, height: '100%', background: 'var(--orange)', borderRadius: 'var(--radius-full)', transition: 'width 0.5s' }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: 'var(--space-3xl)', marginBottom: 'var(--space-lg)' }}>Szczegółowe raporty</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {[
          { id: 'work-orders', title: 'Raport zleceń', desc: 'Zestawienia i analiza zleceń' },
          { id: 'sales', title: 'Raport sprzedaży', desc: 'Dokumenty sprzedażowe i WZ' },
          { id: 'customers', title: 'Raport klientów', desc: 'Zlecenia i aktywność' },
          { id: 'employees', title: 'Raport pracowników', desc: 'Rozliczenia i czas pracy' },
          { id: 'vehicles', title: 'Raport pojazdów', desc: 'Historia pojazdów' },
          { id: 'warehouse', title: 'Raport magazynowy', desc: 'Stany, ruchy i dokumenty' },
          { id: 'cash', title: 'Raport kasowy', desc: 'Dokumenty i pozycje kasowe' }
        ].map(report => (
          <Link key={report.id} href={`/reports/${report.id}`} className="card hover-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '140px', textDecoration: 'none' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{report.title}</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{report.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
