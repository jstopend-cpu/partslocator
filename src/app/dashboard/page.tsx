import DashboardClient from './DashboardClient';

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const PAGE_SIZE = 50;

export default async function CustomerDashboardPage({
searchParams,
}: {
searchParams?: any;
}) {
const params = await searchParams;
const pageParam = params?.page;
const parsed = typeof pageParam === "string" ? Number(pageParam) : 1;
const currentPage = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
const skip = (currentPage - 1) * PAGE_SIZE;

// Δυναμική εισαγωγή της Prisma για να αποφύγουμε θέματα στο Build
const prisma = (await import("@/lib/prisma")).default;

try {
// 1. Φέρνουμε τα δεδομένα από τη βάση (Neon)
const [products, totalCount, distinctDealers] = await Promise.all([
prisma.product.findMany({
take: PAGE_SIZE,
skip: skip,
orderBy: { updatedAt: "desc" },
include: { brand: true, dealer: true }
}),
prisma.product.count(),
prisma.product.findMany({
distinct: ["dealerId"],
select: { dealerId: true },
}),
]);

} catch (error) {
console.error("Database Error:", error);
return (
<div className="p-10 text-red-500 bg-white shadow-md rounded-lg">
<h1 className="text-xl font-bold">Σφάλμα Σύνδεσης</h1>
<p>Δεν ήταν δυνατή η ανάκτηση των δεδομένων. Παρακαλώ ελέγξτε τα Logs στη Vercel.</p>
</div>
);
}
}