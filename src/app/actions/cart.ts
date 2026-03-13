"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/database/client";

export type CartItemRow = {
  id: string;
  masterProductId: string;
  partNumber: string;
  quantity: number;
  price: number;
  brand: string;
  description: string;
};

export async function getCart(): Promise<CartItemRow[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const rows = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    masterProductId: r.masterProductId,
    partNumber: r.partNumber,
    quantity: r.quantity,
    price: r.price,
    brand: r.brand,
    description: r.description,
  }));
}

export async function getCartCount(): Promise<number> {
  const { userId } = await auth();
  if (!userId) return 0;
  const result = await prisma.cartItem.aggregate({
    where: { userId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

export async function addToCart(params: {
  masterProductId: string;
  partNumber: string;
  quantity?: number;
  price: number;
  brand: string;
  description: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Πρέπει να είστε συνδεδεμένοι." };
  }

  const { masterProductId, partNumber, price, brand, description } = params;
  const quantity = Math.max(1, params.quantity ?? 1);

  try {
    await prisma.cartItem.upsert({
      where: {
        userId_masterProductId: { userId, masterProductId },
      },
      create: {
        userId,
        masterProductId,
        partNumber,
        quantity,
        price,
        brand,
        description,
      },
      update: {
        quantity: { increment: quantity },
        price,
        partNumber,
      },
    });
    return { ok: true };
  } catch (e) {
    console.error("[cart] addToCart:", e);
    return { ok: false, error: "Αποτυχία προσθήκης στο καλάθι." };
  }
}

export async function removeFromCart(cartItemId: string): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Πρέπει να είστε συνδεδεμένοι." };
  }

  try {
    await prisma.cartItem.deleteMany({
      where: { id: cartItemId, userId },
    });
    return { ok: true };
  } catch (e) {
    console.error("[cart] removeFromCart:", e);
    return { ok: false, error: "Αποτυχία αφαίρεσης από το καλάθι." };
  }
}

export async function updateCartQuantity(
  cartItemId: string,
  quantity: number,
): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Πρέπει να είστε συνδεδεμένοι." };
  }
  if (quantity < 1) {
    await prisma.cartItem.deleteMany({
      where: { id: cartItemId, userId },
    });
    return { ok: true };
  }

  try {
    await prisma.cartItem.updateMany({
      where: { id: cartItemId, userId },
      data: { quantity },
    });
    return { ok: true };
  } catch (e) {
    console.error("[cart] updateCartQuantity:", e);
    return { ok: false, error: "Αποτυχία ενημέρωσης ποσότητας." };
  }
}

export async function clearCart(): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Πρέπει να είστε συνδεδεμένοι." };
  }
  try {
    await prisma.cartItem.deleteMany({ where: { userId } });
    return { ok: true };
  } catch (e) {
    console.error("[cart] clearCart:", e);
    return { ok: false, error: "Αποτυχία εκκαθάρισης καλαθιού." };
  }
}
