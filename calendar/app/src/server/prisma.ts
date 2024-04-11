import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = (): PrismaClient => {
  return new PrismaClient()
}

declare global {
  const prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

// @ts-expect-error "prismaGlobal" can't be typed in the globalThis scope
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') {
  // @ts-expect-error "prismaGlobal" can't be typed in the globalThis scope
  globalThis.prismaGlobal = prisma
}
