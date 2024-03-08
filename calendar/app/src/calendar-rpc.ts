import { router, baseProcedure } from './server/trpc'
import { CalendarSchema, getSvgAsDocumentDom } from './calendar'
import type * as d3 from 'd3'

export const calendarRouter = router({
  postCreate: baseProcedure
    .input(CalendarSchema)
    .mutation((opts) => {
      const { input } = opts

      const svgDom: d3.Selection<HTMLElement, unknown, null, undefined> = getSvgAsDocumentDom(input)
      const svg = svgDom.html()
      return svg
    }),
  postList: baseProcedure.query(() => {
    return []
  })
})
