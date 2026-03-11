import DashboardClient from './DashboardClient';
import prisma from '@/lib/prisma';

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  // Αν είμαστε σε φάση Build, επέστρεψε ένα απλό div για να μην κρασάρει η Prisma
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return <div className="p-10">Loading...</div>;
  }

  try {
    const products = await prisma.product.findMany({
      take: 50,
      include: { brand: true, dealer: true }
    });

    const totalCount = await prisma.product.count();

    const mapped = products.map((p: any) => ({
      id: p.id,
      name: p.name || 'Χωρίς Όνομα',
      ean: p.id, 
      supplier: p.dealer?.name || 'VOLVO',
      price: p.price || 0,
      stock: p.stock || 0,
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return (
      <DashboardClient
        initialProducts={mapped as any}
        page={1}
        pageSize={50}
        totalCount={totalCount}
        suppliers={[]}
      />
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return <div className="p-10">Database connection error. Please refresh.</div>;
  }
}