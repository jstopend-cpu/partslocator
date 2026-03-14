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

export async function updateBrandName(
  id: string,
  newName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) {
    return { ok: false, error: "Μη εξουσιοδοτημένο." };
  }
  const trimmedId = id?.trim();
  const trimmedName = newName?.trim();
  if (!trimmedId) return { ok: false, error: "Λάθος brand." };
  if (!trimmedName) return { ok: false, error: "Το νέο όνομα brand είναι υποχρεωτικό." };
  const brand = await prisma.brand.findUnique({ where: { id: trimmedId } });
  if (!brand) return { ok: false, error: "Το brand δεν βρέθηκε." };
  const existing = await prisma.brand.findUnique({
    where: { name_categoryId: { name: trimmedName, categoryId: brand.categoryId } },
  });
  if (existing && existing.id !== trimmedId) {
    return { ok: false, error: "Υπάρχει ήδη brand με αυτό το όνομα σε αυτή την κατηγορία." };
  }
  try {
    await prisma.brand.update({
      where: { id: trimmedId },
      data: { name: trimmedName },
    });
    return { ok: true };
  } catch (e) {
    console.error("[updateBrandName]", e);
    return { ok: false, error: "Αποτυχία ενημέρωσης ονόματος." };
  }
}

export async function deleteBrand(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) {
    return { ok: false, error: "Μη εξουσιοδοτημένο." };
  }
  const trimmed = id?.trim();
  if (!trimmed) return { ok: false, error: "Λάθος brand." };
  const brand = await prisma.brand.findUnique({ where: { id: trimmed } });
  if (!brand) return { ok: false, error: "Το brand δεν βρέθηκε." };
  const productCount = await prisma.masterProduct.count({
    where: { brand: brand.name },
  });
  if (productCount > 0) {
    return {
      ok: false,
      error: "Cannot delete brand with existing products. Please rename it instead.",
    };
  }
  try {
    await prisma.brand.delete({ where: { id: trimmed } });
    return { ok: true };
  } catch (e) {
    console.error("[deleteBrand]", e);
    return { ok: false, error: "Αποτυχία διαγραφής brand." };
  }
}

export async function deleteCategory(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) {
    return { ok: false, error: "Μη εξουσιοδοτημένο." };
  }
  const trimmed = id?.trim();
  if (!trimmed) return { ok: false, error: "Λάθος κατηγορία." };
  try {
    await prisma.category.delete({ where: { id: trimmed } });
    return { ok: true };
  } catch (e) {
    console.error("[deleteCategory]", e);
    return { ok: false, error: "Αποτυχία διαγραφής κατηγορίας." };
  }
}
