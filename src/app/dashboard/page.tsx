import DashboardClient from './DashboardClient';

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
// Δυναμική εισαγωγή της Prisma
const prisma = (await import("@/lib/prisma")).default;

try {
// Φέρνουμε τα πρώτα 100 προϊόντα για να βεβαιωθούμε ότι η σελίδα θα "ανοίξει"
const [products, totalCount] = await Promise.all([
prisma.product.findMany({
take: 100,
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
ΠΡΟΣΟΧΗ: Σφάλμα Σύνδεσης με τη Βάση Δεδομένων.
<br />
<span className="text-sm font-normal text-gray-600">
Λεπτομέρειες: {String(error)}
</span>
</div>
);
}
}