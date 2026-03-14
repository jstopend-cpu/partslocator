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

export type BrandRow = { id: string; name: string; categoryId: string; logoUrl: string | null };

export async function getBrandsByCategory(categoryId: string): Promise<BrandRow[]> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) return [];
  const trimmed = categoryId?.trim();
  if (!trimmed) return [];
  const list = await prisma.brand.findMany({
    where: { categoryId: trimmed },
    orderBy: { name: "asc" },
    select: { id: true, name: true, categoryId: true, logoUrl: true },
  });
  return list.map((b) => ({ id: b.id, name: b.name, categoryId: b.categoryId, logoUrl: b.logoUrl ?? null }));
}

export async function getAllBrands(): Promise<BrandRow[]> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) return [];
  const list = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, categoryId: true, logoUrl: true },
  });
  return list.map((b) => ({ id: b.id, name: b.name, categoryId: b.categoryId, logoUrl: b.logoUrl ?? null }));
}

export async function addBrand(
  name: string,
  categoryId: string,
  logoUrl?: string | null,
): Promise<{ ok: true; brandId: string } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) {
    return { ok: false, error: "Μη εξουσιοδοτημένο." };
  }
  const trimmedName = name?.trim();
  const trimmedCategoryId = categoryId?.trim();
  const trimmedLogoUrl = logoUrl?.trim() || null;
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
      update: { logoUrl: trimmedLogoUrl },
      create: { name: trimmedName, categoryId: trimmedCategoryId, logoUrl: trimmedLogoUrl },
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
  logoUrl?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) {
    return { ok: false, error: "Μη εξουσιοδοτημένο." };
  }
  const trimmedId = id?.trim();
  const trimmedName = newName?.trim();
  const trimmedLogoUrl = logoUrl === undefined ? undefined : (logoUrl?.trim() || null);
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
      data: { name: trimmedName, ...(trimmedLogoUrl !== undefined && { logoUrl: trimmedLogoUrl }) },
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
      error: "Δεν μπορεί να διαγραφεί brand με υπάρχοντα προϊόντα. Παρακαλώ αλλάξτε το όνομά του.",
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

export async function updateCategoryName(
  id: string,
  newName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) {
    return { ok: false, error: "Μη εξουσιοδοτημένο." };
  }
  const trimmedId = id?.trim();
  const trimmedName = newName?.trim();
  if (!trimmedId) return { ok: false, error: "Λάθος κατηγορία." };
  if (!trimmedName) return { ok: false, error: "Το νέο όνομα κατηγορίας είναι υποχρεωτικό." };
  const category = await prisma.category.findUnique({ where: { id: trimmedId } });
  if (!category) return { ok: false, error: "Η κατηγορία δεν βρέθηκε." };
  const existing = await prisma.category.findUnique({
    where: { name: trimmedName },
  });
  if (existing && existing.id !== trimmedId) {
    return { ok: false, error: "Υπάρχει ήδη κατηγορία με αυτό το όνομα." };
  }
  try {
    await prisma.category.update({
      where: { id: trimmedId },
      data: { name: trimmedName },
    });
    return { ok: true };
  } catch (e) {
    console.error("[updateCategoryName]", e);
    return { ok: false, error: "Αποτυχία ενημέρωσης ονόματος κατηγορίας." };
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
  const brandCount = await prisma.brand.count({
    where: { categoryId: trimmed },
  });
  if (brandCount > 0) {
    return {
      ok: false,
      error: "Δεν είναι δυνατή η διαγραφή κατηγορίας που περιέχει μάρκες.",
    };
  }
  try {
    await prisma.category.delete({ where: { id: trimmed } });
    return { ok: true };
  } catch (e) {
    console.error("[deleteCategory]", e);
    return { ok: false, error: "Αποτυχία διαγραφής κατηγορίας." };
  }
}
