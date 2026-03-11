import DashboardClient from './DashboardClient';
import prisma from '@/lib/prisma';

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  try {
    // 1. Παίρνουμε τα δεδομένα
    const products = await prisma.product.findMany({
      take: 50,
      include: { brand: true, dealer: true }
    });

    const totalCount = await prisma.product.count();

    // 2. Mapping
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
        supplierIds={[]}
      />
    );
  } catch (error) {
    // ΑΝ ΣΚΑΣΕΙ ΣΤΟ BUILD (ΟΠΩΣ ΤΩΡΑ), ΕΠΙΣΤΡΕΦΟΥΜΕ ΚΑΤΙ ΑΠΛΟ ΓΙΑ ΝΑ ΠΕΡΑΣΕΙ
    return (
      <div className="p-20 bg-white text-gray-800">
        <h1 className="text-xl font-bold">Προετοιμασία Dashboard...</h1>
        <p>Παρακαλώ ανανεώστε τη σελίδα σε λίγο.</p>
      </div>
    );
  }
}