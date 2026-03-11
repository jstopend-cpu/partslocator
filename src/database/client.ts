export const dynamic = 'force-dynamic'

import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const connectionString =
  "postgresql://neondb_owner:npg_KNEMJt9qIZy0@ep-wild-darkness-ad7dmhn8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const pool = new Pool({ connectionString })
const adapter = new PrismaNeon(pool as any)

export const prisma = new PrismaClient({ adapter })
export const query = (text: string, params?: any[]) => pool.query(text, params)
export default prisma
