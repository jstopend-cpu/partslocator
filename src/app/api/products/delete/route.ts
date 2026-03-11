export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/database/client'

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json()

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
    }

    const stringIds = ids.map((id: unknown) => String(id))

    await prisma.product.deleteMany({
      where: {
        id: { in: stringIds },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
