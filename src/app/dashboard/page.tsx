import { DashboardProduct } from "./DashboardClient";
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

const parsed =
typeof pageParam === "string" ? Number(pageParam) : Number(Array.isArray(pageParam) ? pageParam[0] : 1);
const currentPage = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
const skip = (currentPage - 1) * PAGE_SIZE;

const prisma = (await import("@/lib/prisma")).default;

const [products, totalCount, distinctSuppliers] = await Promise.all([
prisma.product.findMany({
orderBy: { updatedAt: "desc" },
skip,
take: PAGE_SIZE,
}),
prisma.product.count(),
prisma.product.findMany({
distinct: ["supplier"],
select: { supplier: true },
orderBy: { supplier: "asc" },
}),
]);

const mapped: DashboardProduct[] = products.map((p) => ({
id: p.id,
name: p.name,
ean: p.ean,
supplier: p.supplier,
price: p.price,
stock: p.stock,
updatedAt: p.updatedAt.toISOString(),
}));

return (
<DashboardClient
initialProducts={mapped}
page={currentPage}
pageSize={PAGE_SIZE}
totalCount={totalCount}
suppliers={distinctSuppliers.map((s) => s.supplier)}
/>
);
}