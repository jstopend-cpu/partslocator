import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const query = async (strings, ...values) => {
let sql = "";
strings.forEach((str, i) => {
sql += str + (values[i] !== undefined ? "$" + (i + 1) : "");
});
return prisma.$queryRawUnsafe(sql, ...values);
};