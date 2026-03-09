import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
try {
const { dealerId, brandId, products } = await req.json();

} catch (error: any) {
return NextResponse.json({ error: error.message }, { status: 500 });
}
}