import { Prisma } from '@prisma/client';

// Re-export basic Prisma types if needed directly
export type { 
  Customer, 
  Vehicle, 
  WorkOrder, 
  Mechanic, 
  Task, 
  CashDocument, 
  WarehouseDocument, 
  InventoryItem, 
  OrderItem,
  Estimate,
  EstimateItem
} from '@prisma/client';

// Complex types with Prisma Payload for includes
export type CustomerWithVehicles = Prisma.CustomerGetPayload<{
  include: { vehicles: true }
}>;

export type WorkOrderWithDetails = Prisma.WorkOrderGetPayload<{
  include: {
    tags: true,
    vehicle: {
      include: { customer: { include: { tags: true } } }
    },
    mechanic: true,
    _count: { select: { items: true } }
  }
}>;

export type VehicleWithCustomerAndOrders = Prisma.VehicleGetPayload<{
  include: {
    customer: true,
    workOrders: true
  }
}>;

export type EstimateWithDetails = Prisma.EstimateGetPayload<{
  include: {
    items: true,
    vehicle: {
      include: { customer: true }
    }
  }
}>;

// Common UI types
export interface ColumnDef {
  id: number;
  key: string;
  title: string;
  color: string;
}
