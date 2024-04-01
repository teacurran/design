import { useTranslation } from 'next-i18next'

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const useLocale = (
  namespace: Parameters<typeof useTranslation>[0] = 'common'
) => useTranslation(namespace)
