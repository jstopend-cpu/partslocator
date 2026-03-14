"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/database/client";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

export type CategoryRow = { id: string; name: string };

export async function getCategories(): Promise<CategoryRow[]> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) {
    return [];
  }
  const list = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return list.map((c) => ({ id: c.id, name: c.name }));
}

export type BrandRow = { id: string; name: string; categoryId: string };

export async function getBrandsByCategory(categoryId: string): Promise<BrandRow[]> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) return [];
  const trimmed = categoryId?.trim();
  if (!trimmed) return [];
  const list = await prisma.brand.findMany({
    where: { categoryId: trimmed },
    orderBy: { name: "asc" },
  });
  return list.map((b) => ({ id: b.id, name: b.name, categoryId: b.categoryId }));
}

export async function addBrand(
  name: string,
  categoryId: string,
): Promise<{ ok: true; brandId: string } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) {
    return { ok: false, error: "Μη εξουσιοδοτημένο." };
  }
  const trimmedName = name?.trim();
  const trimmedCategoryId = categoryId?.trim();
  if (!trimmedName) {
    return { ok: false, error: "Το όνομα brand είναι υποχρεωτικό." };
  }
  if (!trimmedCategoryId) {
    return { ok: false, error: "Επίλεξε κατηγορία." };
  }
  const category = await prisma.category.findUnique({
    where: { id: trimmedCategoryId },
  });
  if (!category) {
    return { ok: false, error: "Η κατηγορία δεν βρέθηκε." };
  }
  try {
    const brand = await prisma.brand.upsert({
      where: {
        name_categoryId: { name: trimmedName, categoryId: trimmedCategoryId },
      },
      update: {},
      create: { name: trimmedName, categoryId: trimmedCategoryId },
    });
    return { ok: true, brandId: brand.id };
  } catch (e) {
    console.error("[addBrand]", e);
    return { ok: false, error: "Αποτυχία προσθήκης brand." };
  }
}
