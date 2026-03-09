import DashboardClient from './DashboardClient';
import prisma from '@/lib/prisma';

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
try {
// 1. Παίρνουμε τα δεδομένα από τη βάση (Neon)
const [products, totalCount] = await Promise.all([
prisma.product.findMany({
take: 50,
include: {
brand: true,
dealer: true
}
}),
prisma.product.count()
]);

} catch (error) {
console.error("Database Error:", error);
return (
<div className="p-20 bg-white text-red-600 font-bold border-2 border-red-200 rounded-lg">
Σφάλμα Σύνδεσης: {String(error)}
</div>
);
}
}