import { prisma } from '@/lib/prisma';

export async function getZleceniaSzczegolowe() {
  const items = await prisma.orderItem.findMany({
    include: {
      workOrder: {
        include: { mechanic: true }
      }
    }
  });

  return items.map((item, idx) => {
    const pracownik = item.workOrder?.mechanic?.name || 'Brak';
    const nazwa = item.name;
    const rodzaj = item.type === 'service' ? 'Usługa' : 'Część';
    const indeks = 'IND-' + item.id;
    const jedn = item.type === 'service' ? 'rbg' : 'szt.';
    const ilosc = item.quantity;
    
    // Zysk i Koszt (mockujemy koszt jako 60% przychodu dla uproszczenia jeśli brak bazy)
    const przychod = (item.unitPrice * item.quantity) - item.discount;
    const koszt = przychod * 0.6; 
    const zysk = przychod - koszt;

    return {
      Pracownik: pracownik,
      Nazwa: nazwa,
      Rodzaj: rodzaj,
      Indeks: indeks,
      'Jedn.': jedn,
      'Ilość': ilosc,
      Koszt: koszt.toFixed(2) + ' zł',
      'Przychód': przychod.toFixed(2) + ' zł',
      Zysk: zysk.toFixed(2) + ' zł'
    };
  });
}

export async function getKasaRaport() {
  const docs = await prisma.cashDocument.findMany({
    orderBy: { date: 'desc' }
  });

  return docs.map((doc, idx) => ({
    Lp: idx + 1,
    Dokument: doc.documentNumber,
    Klient: doc.clientName || 'Brak',
    Data: new Date(doc.date).toLocaleDateString('pl-PL'),
    'Przychód': doc.type === 'KP' ? doc.amount.toFixed(2) + ' zł' : '',
    'Rozchód': doc.type === 'KW' ? doc.amount.toFixed(2) + ' zł' : ''
  }));
}

export async function getKlienciZlecenia() {
  const wos = await prisma.workOrder.findMany({
    include: { vehicle: { include: { customer: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return wos.map((wo, idx) => {
    const brutto = wo.totalAmount;
    const netto = brutto / 1.23;
    
    return {
      Lp: idx + 1,
      Zlecenie: 'ZL/' + wo.id,
      Pojazd: wo.vehicle ? `${wo.vehicle.brand} ${wo.vehicle.model} (${wo.vehicle.plate})` : 'Brak',
      'Wartość netto': netto.toFixed(2) + ' zł',
      'Wartość brutto': brutto.toFixed(2) + ' zł'
    };
  });
}

export async function getMagazynPrzyjecia() {
  const items = await prisma.warehouseDocumentItem.findMany({
    where: { warehouseDocument: { type: 'PZ' } },
    include: { warehouseDocument: true }
  });

  return items.map((item, idx) => ({
    Lp: idx + 1,
    Nazwa: item.name,
    'Kod towaru': item.itemCode,
    Data: new Date(item.warehouseDocument.date).toLocaleDateString('pl-PL'),
    'Przyjęto': item.quantity,
    'Wydano': 0,
    'Pozostało': item.quantity
  }));
}

export async function getMagazynStan() {
  const items = await prisma.inventoryItem.findMany();
  
  return items.map((item, idx) => ({
    Lp: idx + 1,
    Nazwa: item.name,
    'Kod towaru': item.itemCode,
    'Jend.': item.unit,
    Stan: item.quantity,
    Rezerwacja: 0,
    'Dostępne': item.quantity
  }));
}

export async function getZleceniaCzasPracy() {
  const wos = await prisma.workOrder.findMany({
    where: { status: 'done' },
    include: { mechanic: true }
  });

  return wos.map((wo, idx) => ({
    Pracownik: wo.mechanic?.name || 'Brak',
    Nazwa: 'Zlecenie ' + wo.id,
    'Data rozpoczęcia': new Date(wo.createdAt).toLocaleDateString('pl-PL'),
    'Data zakończenia': wo.completedAt ? new Date(wo.completedAt).toLocaleDateString('pl-PL') : 'Brak',
    'Przepr. czas': (wo.workedHours || 0).toFixed(1) + ' h'
  }));
}

export async function getPracownicyRozliczenie() {
  const mechanics = await prisma.mechanic.findMany();
  const wos = await prisma.workOrder.findMany({
    where: { status: 'done' },
    include: { mechanic: true, items: true }
  });
  
  const byDate: Record<string, any> = {};
  wos.forEach(wo => {
    const date = wo.completedAt ? new Date(wo.completedAt).toLocaleDateString('pl-PL') : new Date().toLocaleDateString('pl-PL');
    if (!byDate[date]) {
      byDate[date] = { Data: date };
      mechanics.forEach(m => byDate[date][m.name] = 0);
    }
    const mechName = wo.mechanic?.name || 'Brak';
    const paySum = wo.items.reduce((sum, item) => sum + (item.mechanicPay || 0), 0);
    if (byDate[date][mechName] !== undefined) byDate[date][mechName] += paySum;
  });

  return Object.values(byDate).map(row => {
    const formatted: any = { Data: row.Data };
    Object.keys(row).forEach(k => {
      if (k !== 'Data') formatted[k] = Number(row[k]).toFixed(2) + ' zł';
    });
    return formatted;
  });
}

export async function getPracownicySzczegoloweRozliczenie() {
  const items = await prisma.orderItem.findMany({
    include: { workOrder: true }
  });
  return items.map(item => ({
    Zlecenie: 'ZL/' + item.workOrderId,
    Zadanie: item.name,
    'Wartość zadania': (item.unitPrice * item.quantity).toFixed(2) + ' zł',
    'Wartość rozliczenia': (item.mechanicPay || 0).toFixed(2) + ' zł'
  }));
}

export async function getPracownicyRaportCzasuPracy() {
  const mechanics = await prisma.mechanic.findMany();
  const wos = await prisma.workOrder.findMany({
    where: { status: 'done' },
    include: { mechanic: true }
  });
  
  const byDate: Record<string, any> = {};
  wos.forEach(wo => {
    const date = wo.completedAt ? new Date(wo.completedAt).toLocaleDateString('pl-PL') : new Date().toLocaleDateString('pl-PL');
    if (!byDate[date]) {
      byDate[date] = { Data: date };
      mechanics.forEach(m => byDate[date][m.name] = 0);
    }
    const mechName = wo.mechanic?.name || 'Brak';
    if (byDate[date][mechName] !== undefined) byDate[date][mechName] += (wo.workedHours || 0);
  });

  return Object.values(byDate).map(row => {
    const formatted: any = { Data: row.Data };
    Object.keys(row).forEach(k => {
      if (k !== 'Data') formatted[k] = Number(row[k]).toFixed(1) + ' h';
    });
    return formatted;
  });
}

export async function getPracownicyPorownanieCzasu() {
  const wos = await prisma.workOrder.findMany({
    where: { status: 'done' },
    include: { mechanic: true }
  });
  return wos.map(wo => {
    const est = wo.estimatedHours || 0;
    const wrk = wo.workedHours || 0;
    const diff = wrk - est;
    return {
      Pracownik: wo.mechanic?.name || 'Brak',
      Nazwa: 'Zlecenie ' + wo.id,
      'Rozpoczęcie': new Date(wo.receivedAt).toLocaleDateString('pl-PL'),
      'Zakończenie': wo.completedAt ? new Date(wo.completedAt).toLocaleDateString('pl-PL') : '-',
      'Szac. czas': est.toFixed(1) + ' h',
      'Przepr. czas': wrk.toFixed(1) + ' h',
      'Różnica': (diff > 0 ? '+' : '') + diff.toFixed(1) + ' h'
    };
  });
}

export async function getPracownicySzczegolowyRaportCzasu() {
  const wos = await prisma.workOrder.findMany({
    where: { status: 'done' }
  });
  return wos.map(wo => {
    const brutto = wo.totalAmount;
    const netto = brutto / 1.23;
    return {
      'Przepr. czas': (wo.workedHours || 0).toFixed(1) + ' h',
      'Wartość netto': netto.toFixed(2) + ' zł',
      'Wartość brutto': brutto.toFixed(2) + ' zł'
    };
  });
}

// Fallback logic for reports that don't have deep Prisma implementations yet
export async function getGenericReport(reportName: string, expectedColumns: string[]) {
  // Generate 3 mock rows based on expected columns
  return [1, 2, 3].map(i => {
    const row: any = {};
    expectedColumns.forEach(col => {
      if (col === 'Lp' || col === 'Lp.') row[col] = i;
      else if (col.toLowerCase().includes('data')) row[col] = new Date().toLocaleDateString('pl-PL');
      else if (col.toLowerCase().includes('wartość') || col.toLowerCase().includes('cena') || col.toLowerCase().includes('koszt') || col.toLowerCase().includes('przychód')) row[col] = (Math.random() * 1000).toFixed(2) + ' zł';
      else if (col.toLowerCase().includes('ilość') || col.toLowerCase().includes('stan')) row[col] = Math.floor(Math.random() * 10) + 1;
      else row[col] = `${col} ${i}`;
    });
    return row;
  });
}
