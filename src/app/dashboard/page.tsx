import nextDynamic from 'next/dynamic';

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DashboardClient = nextDynamic(() => import('./DashboardClient'), {
ssr: true
});

const PAGE_SIZE = 50;

export default async function CustomerDashboardPage({
searchParams,
}: {
searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
const params = await searchParams;
const pageParam = params?.page;

const parsed = typeof pageParam === "string" ? Number(pageParam) : Number(Array.isArray(pageParam) ? pageParam[0] : 1);
const currentPage = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
const skip = (currentPage - 1) * PAGE_SIZE;

const prisma = (await import("@/lib/prisma")).default;

// 1. Φέρνουμε τα δεδομένα από τη βάση
const [products, totalCount, distinctDealers] = await Promise.all([
prisma.product.findMany({
orderBy: { updatedAt: "desc" },
skip,
take: PAGE_SIZE,
include: { brand: true, dealer: true }
}),
prisma.product.count(),
prisma.product.findMany({
distinct: ["dealerId"],
select: { dealerId: true },
}),
])

// 2. Mapping των δεδομένων για το Frontend
const mapped = products.map((p) => ({
id: p.id,
name: p.name,
ean: p.partNumber,
dealerId: p.dealerId,
price: p.price,
stock: p.stock,
updatedAt: p.updatedAt.toISOString(),
}));

return (
<DashboardClient
initialProducts={mapped as any}
page={currentPage}
pageSize={PAGE_SIZE}
totalCount={totalCount}
dealerIds={distinctDealers.map((d) => d.dealerId)}
/>
);
}