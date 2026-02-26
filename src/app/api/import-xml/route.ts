import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseStringPromise } from 'xml2js';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const xmlText = await file.text();
    const result = await parseStringPromise(xmlText);

    // Προσαρμογή: Εδώ υποθέτουμε ότι το XML έχει τη δομή <products><item>...
    // Αν το XML του προμηθευτή σου είναι διαφορετικό, θα το αλλάξουμε εδώ.
    const items = result.products.item;

    for (const item of items) {
      await query(
        `INSERT INTO products (name, ean, supplier, price, stock)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (ean) DO UPDATE 
         SET price = $4, stock = $5`,
        [
          item.name[0], 
          item.ean[0], 
          item.supplier[0], 
          parseFloat(item.price[0].replace(',', '.')), // Μετατροπή κόμματος σε τελεία για την τιμή
          parseInt(item.stock[0])
        ]
      );
    }

    return NextResponse.json({ success: true, count: items.length });
  } catch (error) {
    console.error('XML Import Error:', error);
    return NextResponse.json({ success: false, error: "Failed to parse XML" }, { status: 500 });
  }
}