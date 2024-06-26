import type { CreateNextContextOptions } from '@trpc/server/adapters/next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import prisma from './prisma'
import { type SSRConfig } from 'next-i18next'
import { type NextApiRequest } from 'next'

/**
 * Defines your inner context shape.
 * Add fields here that the inner context brings.
 */
export interface CreateInnerContextOptions
  extends Partial<CreateNextContextOptions> {
  locale?: string
  i18n?: Awaited<ReturnType<typeof serverSideTranslations>>
}

/**
 * Inner context. Will always be available in your procedures, in contrast to the outer context.
 *
 * Also useful for:
 * - testing, so you don't have to mock Next.js' `req`/`res`
 * - tRPC's `createSSGHelpers` where we don't have `req`/`res`
 *
 * @link https://trpc.io/docs/v11/context#inner-and-outer-context
 */
export async function createInnerTRPCContext (opts?: CreateInnerContextOptions): Promise<{
  prisma: typeof prisma
  calendar: typeof prisma.calendar
} & CreateInnerContextOptions> {
  return {
    prisma,
    calendar: prisma.calendar,
    ...opts
  }
}

/**
 * Outer context. Used in the routers and will e.g. bring `req` & `res` to the context as "not `undefined`".
 *
 * @link https://trpc.io/docs/v11/context#inner-and-outer-context
 */
export const createTRPCContext = async (opts?: CreateNextContextOptions): Promise<{
  req?: NextApiRequest
  locale?: string
  i18n?: SSRConfig
  prisma: typeof prisma
  calendar: typeof prisma.calendar
} & CreateInnerContextOptions> => {
  const acceptLanguage = opts?.req.headers['accept-language']
  // If you store locales on User in DB, you can use that instead
  // We use the accept-language header to determine the locale here.
  const locale: string | undefined = (acceptLanguage === undefined || acceptLanguage?.includes('en')) ? 'en' : 'es'
  const _i18n: SSRConfig = await serverSideTranslations(locale, ['common'])

  const innerContext = await createInnerTRPCContext({
    req: opts?.req,
    locale,
    i18n: _i18n
  })

  return {
    ...innerContext,
    req: opts?.req
  }
}
