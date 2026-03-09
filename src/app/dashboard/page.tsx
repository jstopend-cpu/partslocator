import nextDynamic from 'next/dynamic';

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const DashboardClient = nextDynamic(() => import('./DashboardClient'), {
ssr: false
});

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

// Εισαγωγή της Prisma
const prisma = (await import("@/lib/prisma")).default;

try {
// 1. Φέρνουμε τα δεδομένα από τη βάση
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
<div className="p-10 text-red-500 bg-white">
Σφάλμα σύνδεσης με τη βάση δεδομένων.
<br />
Παρακαλώ ελέγξτε τα Logs στη Vercel.
</div>
);
}
}