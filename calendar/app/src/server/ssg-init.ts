import { createServerSideHelpers } from '@trpc/react-query/server'
import type { GetStaticPropsContext } from 'next'
import { i18n } from '../../next-i18next.config'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { createInnerTRPCContext } from './context'
import type { AppRouter } from './routers/_app'
import { appRouter } from './routers/_app'
import superjson from 'superjson'

export async function ssgInit<TParams extends { locale?: string }> (
  opts: GetStaticPropsContext<TParams>
) {
  const locale = opts.params?.locale ?? opts?.locale ?? i18n.defaultLocale
  const _i18n = await serverSideTranslations(locale, ['common'])

  const ssg = createServerSideHelpers<AppRouter>({
    router: appRouter,
    ctx: await createInnerTRPCContext({
      locale,
      i18n: _i18n
    }),
    transformer: superjson
  })

  // Prefetch i18n everytime
  await ssg.i18n.fetch()

  return ssg
}
