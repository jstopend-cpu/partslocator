import { PrismaClient } from '@prisma/client'
import { neon } from '@neondatabase/serverless'

// Αυτό επιτρέπει στον Prisma να "μιλάει" μέσω HTTP (θύρα 443) αντί για 5432
const sql = neon(process.env.DATABASE_URL!)
export const prisma = new PrismaClient()