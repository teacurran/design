import { router, publicProcedure } from './trpc'
import { CalendarSchema, getSvgAsDocumentDom } from './calendar'
import type * as d3 from 'd3'

export const calendarRouter = router({
  postCreate: publicProcedure
    .input(CalendarSchema)
    .mutation((opts) => {
      const { input } = opts

      const svgDom: d3.Selection<HTMLElement, unknown, null, undefined> = getSvgAsDocumentDom(input)
      const svg = svgDom.html()
      return svg
    }),
  postList: publicProcedure.query(() => {
    return []
  })
})
