import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const query = async (strings: TemplateStringsArray, ...values: any[]) => {
const sql = strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? $${i + 1} : ""), "");
return prisma.$queryRawUnsafe(sql, ...values);
};