/**
 * @link https://prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices
 */
import { type PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
