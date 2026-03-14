"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/database/client";

const SUBORDER_ALLOWED_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED"] as const;

export type SupplierSubOrderRow = {
  id: string;
  orderId: string;
  status: string;
  totalPrice: number;
  createdAt: Date;
  customerName: string | null;
  shippingName: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  shippingPhone: string | null;
};

export type SupplierOrderRow = {
  id: string;
  userId: string;
  status: string;
  totalPrice: number;
  createdAt: Date;
  shippingName: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  shippingPhone: string | null;
  items: { id: string; partNumber: string; description: string; price: number; quantity: number }[];
};

/** Resolve supplier id: first by Clerk userId on Supplier, then by publicMetadata.supplierId. */
async function getSupplierIdFromUser(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const byUserId = await prisma.supplier.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (byUserId) return byUserId.id;
  const user = await currentUser();
  const metadata = user?.publicMetadata as { role?: string; supplierId?: string } | undefined;
  if (metadata?.role !== "SUPPLIER" || !metadata?.supplierId) return null;
  const supplier = await prisma.supplier.findUnique({
    where: { id: metadata.supplierId },
    select: { id: true },
  });
  return supplier?.id ?? null;
}

export type SupplierDashboardStats = {
  pendingOrders: number;
  totalSalesThisMonth: number;
  totalProducts: number;
};

export async function getSupplierDashboardStats(): Promise<SupplierDashboardStats | null> {
  const supplierId = await getSupplierIdFromUser();
  if (!supplierId) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pendingCount, salesRows, productCount] = await Promise.all([
    prisma.subOrder.count({
      where: { supplierId, status: "PENDING" },
    }),
    prisma.subOrder.findMany({
      where: { supplierId, createdAt: { gte: startOfMonth } },
      select: { totalPrice: true },
    }),
    prisma.supplierStock.count({ where: { supplierId } }),
  ]);

  const totalSalesThisMonth = salesRows.reduce((s, r) => s + r.totalPrice, 0);

  return {
    pendingOrders: pendingCount,
    totalSalesThisMonth,
    totalProducts: productCount,
  };
}

/** Sub-orders belonging only to this supplier. */
export async function getSupplierSubOrders(): Promise<SupplierSubOrderRow[]> {
  const supplierId = await getSupplierIdFromUser();
  if (!supplierId) return [];

  const subOrders = await prisma.subOrder.findMany({
    where: { supplierId },
    orderBy: { createdAt: "desc" },
    include: { order: true },
  });

  return subOrders.map((s) => ({
    id: s.id,
    orderId: s.orderId,
    status: s.status,
    totalPrice: s.totalPrice,
    createdAt: s.createdAt,
    customerName: s.order.shippingName ?? s.order.userId,
    shippingName: s.order.shippingName,
    shippingAddress: s.order.shippingAddress,
    shippingCity: s.order.shippingCity,
    shippingPostalCode: s.order.shippingPostalCode,
    shippingPhone: s.order.shippingPhone,
  }));
}

export type SubOrderDetailRow = {
  id: string;
  orderId: string;
  status: string;
  totalPrice: number;
  createdAt: Date;
  shippingName: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  shippingPhone: string | null;
  items: { id: string; partNumber: string; description: string; price: number; quantity: number }[];
};

export async function getSubOrderById(subOrderId: string): Promise<SubOrderDetailRow | null> {
  const supplierId = await getSupplierIdFromUser();
  if (!supplierId) return null;

  const sub = await prisma.subOrder.findFirst({
    where: { id: subOrderId, supplierId },
    include: { order: true, items: true },
  });
  if (!sub) return null;

  return {
    id: sub.id,
    orderId: sub.orderId,
    status: sub.status,
    totalPrice: sub.totalPrice,
    createdAt: sub.createdAt,
    shippingName: sub.order.shippingName,
    shippingAddress: sub.order.shippingAddress,
    shippingCity: sub.order.shippingCity,
    shippingPostalCode: sub.order.shippingPostalCode,
    shippingPhone: sub.order.shippingPhone,
    items: sub.items.map((i) => ({
      id: i.id,
      partNumber: i.partNumber,
      description: i.description,
      price: i.price,
      quantity: i.quantity,
    })),
  };
}

export async function updateSubOrderStatus(
  subOrderId: string,
  newStatus: string,
): Promise<{ ok: boolean; error?: string }> {
  const supplierId = await getSupplierIdFromUser();
  if (!supplierId) return { ok: false, error: "Μη εξουσιοδοτημένο." };

  if (!SUBORDER_ALLOWED_STATUSES.includes(newStatus as (typeof SUBORDER_ALLOWED_STATUSES)[number])) {
    return { ok: false, error: "Μη έγκυρη κατάσταση. Επιτρέπονται: PENDING, PROCESSING, SHIPPED, COMPLETED." };
  }

  const sub = await prisma.subOrder.findFirst({
    where: { id: subOrderId, supplierId },
  });
  if (!sub) return { ok: false, error: "Η παραγγελία δεν βρέθηκε ή δεν σας αφορά." };

  try {
    await prisma.subOrder.update({
      where: { id: subOrderId },
      data: { status: newStatus },
    });
    return { ok: true };
  } catch (e) {
    console.error("[supplier-portal] updateSubOrderStatus:", e);
    return { ok: false, error: "Αποτυχία ενημέρωσης κατάστασης." };
  }
}

/** Legacy: orders that contain at least one product supplied by this supplier (master orders). Kept for backward compat if needed. */
export async function getSupplierOrders(): Promise<SupplierOrderRow[]> {
  const supplierId = await getSupplierIdFromUser();
  if (!supplierId) return [];

  const orderIdsWithOurProducts = await prisma.supplierStock.findMany({
    where: { supplierId },
    select: { masterProductId: true },
  });
  const masterIds = [...new Set(orderIdsWithOurProducts.map((s) => s.masterProductId))];

  const orders = await prisma.order.findMany({
    where: {
      items: {
        some: { masterProductId: { in: masterIds } },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        where: { masterProductId: { in: masterIds } },
        select: { id: true, partNumber: true, description: true, price: true, quantity: true },
      },
    },
  });

  return orders.map((o) => ({
    id: o.id,
    userId: o.userId,
    status: o.status,
    totalPrice: o.totalPrice,
    createdAt: o.createdAt,
    shippingName: o.shippingName,
    shippingAddress: o.shippingAddress,
    shippingCity: o.shippingCity,
    shippingPostalCode: o.shippingPostalCode,
    shippingPhone: o.shippingPhone,
    items: o.items,
  }));
}

export async function getSupplierForPortal(): Promise<{ id: string; name: string } | null> {
  const supplierId = await getSupplierIdFromUser();
  if (!supplierId) return null;
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { id: true, name: true },
  });
  return supplier;
}
