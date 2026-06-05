import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({
  url: 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Механики ──
  const mech1 = await prisma.mechanic.create({
    data: { name: 'Tomasz Kowalski', specialization: 'Двигатели', phone: '+48 600 111 222', status: 'available' },
  });
  const mech2 = await prisma.mechanic.create({
    data: { name: 'Piotr Nowak', specialization: 'Электрика', phone: '+48 600 333 444', status: 'busy' },
  });
  const mech3 = await prisma.mechanic.create({
    data: { name: 'Marek Wiśniewski', specialization: 'Ходовая часть', phone: '+48 600 555 666', status: 'available' },
  });

  // ── Клиенты + Авто ──
  const cust1 = await prisma.customer.create({
    data: {
      firstName: 'Jan',
      lastName: 'Kowalczyk',
      phone: '+48 512 345 678',
      email: 'jan.k@email.com',
      notes: 'Постоянный клиент',
      vehicles: {
        create: [
          { brand: 'BMW', model: '320d F30', year: 2018, vin: 'WBAJB51060G843241', plate: 'WA 12345', mileage: 125000 },
          { brand: 'Audi', model: 'A4 B9', year: 2020, vin: 'WAUZZZ8V3KA012345', plate: 'WA 67890', mileage: 85000 },
        ],
      },
    },
    include: { vehicles: true },
  });

  const cust2 = await prisma.customer.create({
    data: {
      firstName: 'Anna',
      lastName: 'Nowak',
      phone: '+48 601 987 654',
      email: 'anna.n@email.com',
      vehicles: {
        create: [
          { brand: 'Volkswagen', model: 'Golf VII', year: 2017, vin: 'WVWZZZ1KZHW123456', plate: 'WB 11111', mileage: 150000 },
        ],
      },
    },
    include: { vehicles: true },
  });

  const cust3 = await prisma.customer.create({
    data: {
      firstName: 'Krzysztof',
      lastName: 'Zieliński',
      phone: '+48 505 222 333',
      email: 'krzysztof.z@email.com',
      notes: 'Корпоративный клиент — 3 авто',
      vehicles: {
        create: [
          { brand: 'Mercedes-Benz', model: 'C220d W205', year: 2019, vin: 'WDD2050081A012345', plate: 'WC 99999', mileage: 98000 },
        ],
      },
    },
    include: { vehicles: true },
  });

  // ── Заказ-наряды с позициями ──
  await prisma.workOrder.create({
    data: {
      status: 'in_progress',
      description: 'Замена масла и фильтров, диагностика двигателя',
      totalAmount: 850,
      vehicleId: cust1.vehicles[0].id,
      mechanicId: mech2.id,
      items: {
        create: [
          { name: 'Масло моторное 5W-30', type: 'part', quantity: 5, unitPrice: 60 },
          { name: 'Фильтр масляный', type: 'part', quantity: 1, unitPrice: 45 },
          { name: 'Фильтр воздушный', type: 'part', quantity: 1, unitPrice: 35 },
          { name: 'Замена масла + фильтров', type: 'service', quantity: 1, unitPrice: 200 },
          { name: 'Компьютерная диагностика', type: 'service', quantity: 1, unitPrice: 270 },
        ],
      },
    },
  });

  await prisma.workOrder.create({
    data: {
      status: 'pending',
      description: 'Замена тормозных колодок и дисков передних',
      totalAmount: 1200,
      vehicleId: cust2.vehicles[0].id,
      mechanicId: null,
      items: {
        create: [
          { name: 'Тормозные колодки передние', type: 'part', quantity: 1, unitPrice: 280 },
          { name: 'Тормозные диски передние', type: 'part', quantity: 2, unitPrice: 200 },
          { name: 'Замена тормозов', type: 'service', quantity: 1, unitPrice: 320 },
        ],
      },
    },
  });

  await prisma.workOrder.create({
    data: {
      status: 'done',
      description: 'ТО-2 по регламенту, замена ремня ГРМ',
      totalAmount: 2400,
      vehicleId: cust3.vehicles[0].id,
      mechanicId: mech1.id,
      completedAt: new Date('2025-05-25'),
      items: {
        create: [
          { name: 'Комплект ГРМ', type: 'part', quantity: 1, unitPrice: 850 },
          { name: 'Помпа водяная', type: 'part', quantity: 1, unitPrice: 350 },
          { name: 'Замена ГРМ + помпа', type: 'service', quantity: 1, unitPrice: 1200 },
        ],
      },
    },
  });

  // ── Товары (Products) ──
  const prod1 = await prisma.inventoryItem.create({
    data: { itemCode: 'OLJ-530-5L', name: 'Olej silnikowy 5W-30 (5L)', category: 'Oleje', quantity: 24, minStock: 10, purchasePrice: 85.00, sellPrice: 129.00 }
  });
  const prod2 = await prisma.inventoryItem.create({
    data: { itemCode: 'FLT-HU816X', name: 'Filtr oleju Mann HU 816 x', category: 'Filtry', quantity: 45, minStock: 20, purchasePrice: 18.00, sellPrice: 32.00 }
  });
  const prod3 = await prisma.inventoryItem.create({
    data: { itemCode: 'BRK-P85020', name: 'Klocki hamulcowe Brembo P 85 020', category: 'Hamulce', quantity: 8, minStock: 10, purchasePrice: 110.00, sellPrice: 185.00 }
  });
  const prod4 = await prisma.inventoryItem.create({
    data: { itemCode: 'SPK-BKR6EIX', name: 'Świeca zapłonowa NGK BKR6EIX', category: 'Zapłon', quantity: 60, minStock: 30, purchasePrice: 15.00, sellPrice: 28.00 }
  });

  // ── Покупки (Purchases) ──
  await prisma.warehouseDocument.create({
    data: {
      type: 'PZ',
      documentNumber: 'ZAK-2025/001',
      date: new Date('2025-05-20'),
      status: 'delivered',
      contractorName: 'AutoParts Sp. z o.o.',
      totalValue: 2450.00,
      items: {
        create: [
          { itemCode: prod1.itemCode, name: prod1.name, quantity: 10, price: 85.00 },
          { itemCode: prod2.itemCode, name: prod2.name, quantity: 20, price: 18.00 }
        ]
      }
    }
  });

  await prisma.warehouseDocument.create({
    data: {
      type: 'PZ',
      documentNumber: 'ZAK-2025/002',
      date: new Date('2025-05-25'),
      status: 'ordered',
      contractorName: 'Bosch Service',
      totalValue: 1860.00,
      items: {
        create: [
          { itemCode: prod3.itemCode, name: prod3.name, quantity: 12, price: 110.00 }
        ]
      }
    }
  });

  // ── Продажи (Sales) ──
  await prisma.warehouseDocument.create({
    data: {
      type: 'FV',
      documentNumber: 'FV-2025/001',
      date: new Date('2025-05-20'),
      status: 'paid',
      contractorName: 'Jan Kowalski (BMW 320d)',
      totalValue: 1850.00,
      items: {
        create: [
          { itemCode: prod1.itemCode, name: prod1.name, quantity: 1, price: 129.00 },
          { itemCode: prod2.itemCode, name: prod2.name, quantity: 1, price: 32.00 },
          { itemCode: 'SRV-001', name: 'Wymiana oleju i filtrów', quantity: 1, price: 200.00 }
        ]
      }
    }
  });

  await prisma.warehouseDocument.create({
    data: {
      type: 'FV',
      documentNumber: 'FV-2025/002',
      date: new Date('2025-05-22'),
      status: 'sent',
      contractorName: 'Anna Nowak (VW Golf VII)',
      totalValue: 3200.00,
      items: {
        create: [
          { itemCode: prod3.itemCode, name: prod3.name, quantity: 1, price: 185.00 },
          { itemCode: 'SRV-002', name: 'Wymiana klocków hamulcowych', quantity: 1, price: 300.00 }
        ]
      }
    }
  });

  console.log('✅ Seed data inserted successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
