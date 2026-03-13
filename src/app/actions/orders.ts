"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/database/client";
import { getCart } from "@/app/actions/cart";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";
const ALLOWED_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

export type OrderItemRow = {
  id: string;
  partNumber: string;
  description: string;
  price: number;
  quantity: number;
};

export type OrderRow = {
  id: string;
  status: string;
  totalPrice: number;
  createdAt: Date;
  items: OrderItemRow[];
};

export async function createOrder(): Promise<
  { ok: true; orderId: string } | { ok: false; error: string }
> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Πρέπει να είστε συνδεδεμένοι." };
  }

  const cart = await getCart();
  if (cart.length === 0) {
    return { ok: false, error: "Το καλάθι είναι άδειο." };
  }

  const totalPrice = cart.reduce(
    (sum, i) => sum + i.price * 1.24 * i.quantity,
    0,
  );

  try {
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          status: "PENDING",
          totalPrice,
        },
      });
      await tx.orderItem.createMany({
        data: cart.map((item) => ({
          orderId: newOrder.id,
          masterProductId: item.masterProductId,
          partNumber: item.partNumber,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
        })),
      });
      await tx.cartItem.deleteMany({ where: { userId } });
      return newOrder;
    });
    return { ok: true, orderId: order.id };
  } catch (e) {
    console.error("[orders] createOrder:", e);
    return { ok: false, error: "Αποτυχία δημιουργίας παραγγελίας." };
  }
}

export async function getOrders(): Promise<OrderRow[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
    },
  });
  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    totalPrice: o.totalPrice,
    createdAt: o.createdAt,
    items: o.items.map((i) => ({
      id: i.id,
      partNumber: i.partNumber,
      description: i.description,
      price: i.price,
      quantity: i.quantity,
    })),
  }));
}

export type AdminOrderRow = OrderRow & { userId: string };

export async function getAllOrdersAdmin(): Promise<AdminOrderRow[]> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) return [];

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return orders.map((o) => ({
    id: o.id,
    userId: o.userId,
    status: o.status,
    totalPrice: o.totalPrice,
    createdAt: o.createdAt,
    items: o.items.map((i) => ({
      id: i.id,
      partNumber: i.partNumber,
      description: i.description,
      price: i.price,
      quantity: i.quantity,
    })),
  }));
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) {
    return { ok: false, error: "Μη εξουσιοδοτημένο." };
  }
  if (!ALLOWED_STATUSES.includes(newStatus as (typeof ALLOWED_STATUSES)[number])) {
    return { ok: false, error: "Μη έγκυρη κατάσταση." };
  }
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
    return { ok: true };
  } catch (e) {
    console.error("[orders] updateOrderStatus:", e);
    return { ok: false, error: "Αποτυχία ενημέρωσης κατάστασης." };
  }
}

export type RevenueByMonth = { month: string; revenue: number };
export type TopProduct = { partNumber: string; totalQuantity: number };

export type AdminStats = {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  growthPercent: number;
  revenueByMonth: RevenueByMonth[];
  topProducts: TopProduct[];
};

export async function getAdminStats(): Promise<AdminStats | null> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) return null;

  const [completedOrders, allOrders, pendingCount, orderItems] = await Promise.all([
    prisma.order.findMany({
      where: { status: "COMPLETED" },
      select: { totalPrice: true, createdAt: true },
    }),
    prisma.order.findMany({
      select: { id: true },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.orderItem.findMany({
      select: { partNumber: true, quantity: true },
    }),
  ]);

  const totalRevenue = completedOrders.reduce((s, o) => s + o.totalPrice, 0);
  const totalOrders = allOrders.length;

  const byMonth: Record<string, number> = {};
  for (const o of completedOrders) {
    const key = `${o.createdAt.getUTCFullYear()}-${String(o.createdAt.getUTCMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] ?? 0) + o.totalPrice;
  }
  const revenueByMonth: RevenueByMonth[] = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue }));

  const now = new Date();
  const thisMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const lastMonth = now.getUTCMonth() === 0 ? 11 : now.getUTCMonth() - 1;
  const lastMonthYear = now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
  const lastMonthKey = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, "0")}`;
  const thisMonthRevenue = byMonth[thisMonthKey] ?? 0;
  const lastMonthRevenue = byMonth[lastMonthKey] ?? 0;
  const growthPercent =
    lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

  const partCount: Record<string, number> = {};
  for (const i of orderItems) {
    partCount[i.partNumber] = (partCount[i.partNumber] ?? 0) + i.quantity;
  }
  const topProducts: TopProduct[] = Object.entries(partCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([partNumber, totalQuantity]) => ({ partNumber, totalQuantity }));

  return {
    totalRevenue,
    totalOrders,
    pendingOrders: pendingCount,
    growthPercent,
    revenueByMonth,
    topProducts,
  };
}

export type DashboardStats = {
  totalRevenue: number;
  uniqueCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  growthPercent: number;
  totalParts: number;
  totalSuppliers: number;
  monthlySales: RevenueByMonth[];
  orderStatusDistribution: { status: string; count: number }[];
  topProducts: TopProduct[];
};

export type InventoryStats = { totalParts: number; totalSuppliers: number };

export async function getInventoryStats(): Promise<InventoryStats | null> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) return null;
  const [totalParts, totalSuppliers] = await Promise.all([
    prisma.masterProduct.count(),
    prisma.supplier.count(),
  ]);
  return { totalParts, totalSuppliers };
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) return null;

  const completedOrShipped = { status: { in: ["COMPLETED", "SHIPPED"] as string[] } };

  const [
    ordersForRevenue,
    allOrders,
    pendingCount,
    orderItems,
    totalParts,
    totalSuppliers,
  ] = await Promise.all([
    prisma.order.findMany({
      where: completedOrShipped,
      select: { totalPrice: true, createdAt: true },
    }),
    prisma.order.findMany({
      select: { id: true, userId: true, status: true, totalPrice: true, createdAt: true },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.orderItem.findMany({
      select: { partNumber: true, quantity: true },
    }),
    prisma.masterProduct.count(),
    prisma.supplier.count(),
  ]);

  const totalRevenue = ordersForRevenue.reduce((s, o) => s + o.totalPrice, 0);
  const uniqueCustomers = new Set(allOrders.map((o) => o.userId)).size;
  const totalOrders = allOrders.length;

  const byMonth: Record<string, number> = {};
  for (const o of ordersForRevenue) {
    const key = `${o.createdAt.getUTCFullYear()}-${String(o.createdAt.getUTCMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] ?? 0) + o.totalPrice;
  }
  const monthlySales: RevenueByMonth[] = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue }));

  const statusCount: Record<string, number> = {};
  for (const o of allOrders) {
    statusCount[o.status] = (statusCount[o.status] ?? 0) + 1;
  }
  const orderStatusDistribution = Object.entries(statusCount).map(([status, count]) => ({
    status,
    count,
  }));

  const now = new Date();
  const thisMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const lastMonth = now.getUTCMonth() === 0 ? 11 : now.getUTCMonth() - 1;
  const lastMonthYear = now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
  const lastMonthKey = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, "0")}`;
  const thisMonthRevenue = byMonth[thisMonthKey] ?? 0;
  const lastMonthRevenue = byMonth[lastMonthKey] ?? 0;
  const growthPercent =
    lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

  const partCount: Record<string, number> = {};
  for (const i of orderItems) {
    partCount[i.partNumber] = (partCount[i.partNumber] ?? 0) + i.quantity;
  }
  const topProducts: TopProduct[] = Object.entries(partCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([partNumber, totalQuantity]) => ({ partNumber, totalQuantity }));

  return {
    totalRevenue,
    uniqueCustomers,
    totalOrders,
    pendingOrders: pendingCount,
    growthPercent,
    totalParts,
    totalSuppliers,
    monthlySales,
    orderStatusDistribution,
    topProducts,
  };
}
