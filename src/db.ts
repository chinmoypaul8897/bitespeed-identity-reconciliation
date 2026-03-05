import { PrismaClient } from '@prisma/client';

// Initialize the Prisma Client globally to prevent connection exhaustion
const prisma = new PrismaClient();

export default prisma;