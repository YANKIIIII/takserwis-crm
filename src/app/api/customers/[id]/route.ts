import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id: parseInt(id) },
    include: {
      vehicles: {
        include: {
          workOrders: {
            include: { mechanic: true }
          },
          estimates: {
            include: { _count: { select: { items: true } } }
          }
        }
      },
      _count: { select: { vehicles: true } },
      calendarEvents: true,
      tireStorages: true,
      tags: true
    }
  });

  if (!customer) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Найти продажи (документы FV/WZ), где имя контрагента совпадает с именем клиента
  const fvDocs = await prisma.warehouseDocument.findMany({
    where: {
      contractorName: {
        contains: `${customer.firstName} ${customer.lastName}`.trim(),
      },
      type: { in: ['FV', 'PA'] }
    },
    orderBy: { date: 'desc' }
  });

  const proformaDocs = await prisma.warehouseDocument.findMany({
    where: {
      contractorName: {
        contains: `${customer.firstName} ${customer.lastName}`.trim(),
      },
      type: 'PROFORMA'
    },
    orderBy: { date: 'desc' }
  });

  const wzDocs = await prisma.warehouseDocument.findMany({
    where: {
      contractorName: {
        contains: `${customer.firstName} ${customer.lastName}`.trim(),
      },
      type: 'WZ'
    },
    include: { items: true },
    orderBy: { date: 'desc' }
  });

  return NextResponse.json({ ...customer, sales: fvDocs, proformas: proformaDocs, warehouse: wzDocs });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const {
    firstName,
    lastName,
    phone,
    email,
    postalCode,
    city,
    country,
    street,
    defaultVehicleId,
    paymentMethod,
    paymentTerm,
    discountServices,
    discountGoods,
    marketingConsent,
    notes,
    tagIds
  } = body;

  try {
    const updated = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        firstName,
        lastName,
        phone,
        email,
        postalCode,
        city,
        country,
        street,
        defaultVehicleId: defaultVehicleId ? parseInt(defaultVehicleId) : null,
        paymentMethod,
        paymentTerm,
        discountServices: discountServices ? parseFloat(discountServices) : 0,
        discountGoods: discountGoods ? parseFloat(discountGoods) : 0,
        marketingConsent: Boolean(marketingConsent),
        notes,
        ...(tagIds !== undefined ? { tags: { set: tagIds.map((id: number) => ({ id })) } } : {})
      },
      include: {
        vehicles: {
          include: {
            workOrders: {
              include: { mechanic: true }
            },
            estimates: {
              include: { _count: { select: { items: true } } }
            }
          }
        },
        _count: { select: { vehicles: true } },
        tags: true
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 400 });
  }
}
