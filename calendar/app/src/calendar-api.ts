import { Request, Response } from 'express'
import { type Calendar, CalendarSchema, getDefaultCalendar, getSvgAsDocumentDom } from './calendar'
import type * as d3 from 'd3'
import * as puppeteer from 'puppeteer'

export const getCalendar = async (req: Request, res: Response) => {
  const format = req.query.format

  if (req.method === 'POST') {
    const parsed = CalendarSchema.safeParse(req.body)

    if (!parsed.success) {
      // If parsing failed, return an error
      res.status(400).json({ error: 'Invalid request body' })
      return
    }

    const defaultCalendar = getDefaultCalendar()

    const calendar: Calendar = parsed.data
    console.info('calendar', JSON.stringify(calendar))
    const effectiveCalendar = {
      ...defaultCalendar,
      ...calendar
    }

    const svgDom: d3.Selection<HTMLElement, unknown, null, undefined> = getSvgAsDocumentDom(effectiveCalendar)
    const svg = svgDom.html()
    let browser: puppeteer.Browser

    let page: puppeteer.Page | undefined
    if (format === 'pdf' || format === 'png') {
      browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
      page = await browser.newPage()
      await page.setContent(svg)
    }

    if (req.query.format === 'png' && page !== undefined) {
      const png = await page.screenshot({
        type: 'png',
        fullPage: true
      })
      // set the filename with todays date
      const filename = `calendar-${new Date().toISOString().split('T')[0]}.png`
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
      res.send(png)
      return
    }

    if (req.query.format === 'pdf' && page !== undefined) {
      const pdf = await page.pdf({ format: 'A1', landscape: true, scale: 2 })
      // set the filename with todays date
      const filename = `calendar-${new Date().toISOString().split('T')[0]}.pdf`
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
      res.send(pdf)
      return
    }

    res.setHeader('Content-Type', 'image/svg+xml')
    res.send(svg)
  }

  res.status(200).json({ name: 'John Doe' })
}
