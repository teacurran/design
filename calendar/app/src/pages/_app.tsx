import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { SSRConfig } from 'next-i18next'
import { appWithTranslation } from 'next-i18next'
import type { AppProps } from 'next/app'
import type { ComponentProps } from 'react'
import { trpc } from '~/utils/trpc'
import { PrimeReactProvider } from 'primereact/api'

import 'primeflex/primeflex.css'
import 'primereact/resources/themes/saga-orange/theme.css'
import '~/styles/global.css'

const I18nextAdapter = appWithTranslation<
AppProps<SSRConfig> & { children: React.ReactNode }
>(({ children }) => <>{children}</>)

const I18nProvider = (props: AppProps): JSX.Element => {
  const _i18n = trpc.i18n.useQuery(undefined, {
    trpc: { context: { skipBatch: true } }
  })

  const locale: string | undefined = _i18n.data?.locale
  const i18n: SSRConfig | undefined = _i18n.data?.i18n

  const passedProps = {
    ...props,
    pageProps: {
      ...props.pageProps,
      ...i18n
    },
    router: (locale !== null && locale !== undefined) ? { locale } : props.router
  } as unknown as ComponentProps<typeof I18nextAdapter>
  return <I18nextAdapter {...passedProps} />
}

const MyApp = ({ Component, pageProps }: AppProps): JSX.Element => {
  return (
    <I18nProvider {...pageProps}>
      <PrimeReactProvider>
        <Component {...pageProps} />
        <ReactQueryDevtools initialIsOpen={false} />
      </PrimeReactProvider>
    </I18nProvider>
  )
}

export default trpc.withTRPC(MyApp)
