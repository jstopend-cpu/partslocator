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
