import express, { type Express, type Request, type Response } from 'express'
import dotenv from 'dotenv'
import * as d3 from 'd3'
import { geoOrthographic } from 'd3-geo'
import { JSDOM } from 'jsdom'
import * as emoji from 'node-emoji'
import * as fluent from 'fluentui-emoji-js'
import * as puppeteer from 'puppeteer'

import {
  canadianHolidays,
  catholicHolidays,
  chineseHolidays,
  federalHolidays,
  hinduHolidays,
  islamicHolidays,
  jewishHolidays,
  otherHolidays,
  personalHolidays
} from './holidays'
import Calendar from './Calendar'

dotenv.config()

const app: Express = express()
const port: string | number = process.env.PORT ?? 3000

const optFriday13th: boolean = true
const optPersonalHolidays: boolean = true
const optUSFederalHolidays: boolean = false
const optCanadianHolidays: boolean = false
const optOtherHolidays: boolean = false
const optJewishHolidays: boolean = false
const optIslamicHolidays: boolean = false
const optCatholicHolidays: boolean = false
const optHinduHolidays: boolean = false
const optChineseHolidays: boolean = false

const cellWidth: number = 50
const cellHeight: number = 75
const gridWidth: number = 32 * cellWidth
const gridHeight: number = 12 * cellHeight

const appendEmoji = async (svg: any, value: string, x: number, y: number): Promise<void> => {
  const emojiName = emoji.which(value)

  const fluentFile = await fluent.fromGlyph(value, 'High Contrast')
  const fluentUrl = `https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets${fluentFile}`
  console.log(`name: ${emojiName}, fluentUrl: ${fluentUrl}`)

  svg.append('image')
    .attr('xlink:href', fluentUrl)
    .attr('x', x + 26)
    .attr('y', y + cellHeight - 24)
    .attr('width', 20)
    .attr('height', 20)
}

app.get('/', (req: Request, res: Response): void => {
  res.send('Express + TypeScript Server')
})

app.get('/calendar2', async (req: Request, res: Response): Promise<void> => {
  const calendar: Calendar = new Calendar()
  // calendar.optVermontWeekends = true
  calendar.optShowMoonPhase = true
  calendar.optVermontWeekends = true
  calendar.optShowGrid = true
  calendar.gridStroke = 'black'
  calendar.gridBorderWidth = 10
  calendar.yearFill = 'black'
  calendar.yearX = 1400
  calendar.rotateMonthNames = true
  calendar.monthNameFill = 'black'
  calendar.optRainbowDays3 = false
  calendar.optShowDayNames = true
  const svgDom: d3.Selection<HTMLElement, unknown, null, undefined> = calendar.getSvgAsDocumentDom()
  res.setHeader('Content-Type', 'image/svg+xml')
  res.send(svgDom.html())
})

app.get('/calendar', async (req: Request, res: Response): Promise<void> => {
  const geoProjection = geoOrthographic()
    .translate([0, 0])
    .scale(10)

  const width = gridWidth
  const height = gridHeight + 100

  const dom = new JSDOM('<!DOCTYPE html><body></body>')
  const documentBody = d3.select(dom.window.document.body)

  const svg = documentBody.append('svg')
    .attr('width', width)
    .attr('height', height)

  svg.append('text')
    .text('2024')
    .attr('x', 1400)
    .attr('y', 80)
    .attr('font-size', '80px')
    .attr('font-family', 'Helvetica')
    .attr('font-weight', 'bold')

  const totalColumns = 32
  const totalRows = 12

  for (let row = 0; row < totalRows; row++) {
    for (let col = 0; col < totalColumns; col++) {
      const x = col * cellWidth
      const y = row * cellHeight + 99

      const date = new Date(new Date().getFullYear(), row, col)

      // if the month different than row then it's the next month and should be blank
      if (date.getMonth() === row) {
        if (optFriday13th) {
          if (date.getDay() === 5 && date.getDate() === 13) {
            await appendEmoji(svg, '👻', x, y)
          }
        }

        if (optPersonalHolidays) {
          const holiday = personalHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optUSFederalHolidays) {
          const holiday = federalHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optCanadianHolidays) {
          const holiday = canadianHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optOtherHolidays) {
          const holiday = otherHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optCatholicHolidays) {
          const holiday = catholicHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optJewishHolidays) {
          const holiday = jewishHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optHinduHolidays) {
          const holiday = hinduHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optIslamicHolidays) {
          const holiday = islamicHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optChineseHolidays) {
          const holiday = chineseHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }
      }
    }
  }

  res.setHeader('Content-Type', 'image/svg+xml')

  svg.attr('xmlns', 'http://www.w3.org/2000/svg')

  res.send(documentBody.html())
})

app.get('/moonmap', async (req: Request, res: Response): Promise<void> => {
  const calendar: Calendar = new Calendar()
  calendar.optShowMoonIllumination = true
  calendar.optVermontWeekends = true
  const svgDom = calendar.getSvgAsDocumentDom()
  res.setHeader('Content-Type', 'image/svg+xml')
  res.send(svgDom.html())
})

app.get('/moonmap.pdf', async (req: Request, res: Response): Promise<void> => {
  const calendar: Calendar = new Calendar()
  calendar.optRainbowWeekends = true
  const svgDom = calendar.getSvgAsDocumentDom()

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setContent(svgDom.html())
  const pdf = await page.pdf({ format: 'A1', landscape: true, scale: 2 })

  res.contentType('application/pdf')
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=invoice.pdf'
  )

  res.send(pdf)
})

app.get('/daylight', async (req: Request, res: Response): Promise<void> => {
  const calendar: Calendar = new Calendar()
  calendar.optVermontWeekends = true
  calendar.optShowMoonPhase = true
  calendar.optShowGrid = true
  const svgDom: d3.Selection<HTMLElement, unknown, null, undefined> = calendar.getSvgAsDocumentDom()
  res.setHeader('Content-Type', 'image/svg+xml')
  res.send(svgDom.html())
})

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})
