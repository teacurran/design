import { baseProcedure, router } from '../trpc'
import { calendarRouter } from './calendar'

export const appRouter = router({
  calendar: calendarRouter,

  i18n: baseProcedure.query(({ ctx }) => ({
    i18n: ctx.i18n,
    locale: ctx.locale
  }))
})

export type AppRouter = typeof appRouter
