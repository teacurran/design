import express, { type Express, type Request, type Response } from 'express'
import dotenv from 'dotenv'
import * as d3 from 'd3'
import { geoOrthographic } from 'd3-geo'
import { JSDOM } from 'jsdom'
import * as emoji from 'node-emoji'
import * as fluent from 'fluentui-emoji-js'
import * as puppeteer from 'puppeteer'
import * as Joi from 'joi'
import {
  type ContainerTypes,
  createValidator,
  type ValidatedRequest,
  type ValidatedRequestSchema
} from 'express-joi-validation'

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
import * as fs from 'fs'

dotenv.config()

const app: Express = express()
const validator = createValidator()

// allow CORS from anywhere
app.use((req: Request, res: Response, next: () => void): void => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

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

const calendarParams = Joi.object({
  format: Joi.string().optional().default('svg').allow(null, 'svg', 'pdf'),
  showGrid: Joi.boolean().optional().default(true),
  vermontWeekends: Joi.boolean().optional().default(false),
  showMoonPhases: Joi.boolean().optional().default(false),
  showMoonIllunination: Joi.boolean().optional().default(false),
  showDayNames: Joi.boolean().optional().default(false),
  hideWeekendDayNames: Joi.boolean().optional().default(false),
  theme: Joi.string().optional().default('vermontWeekends')
    .allow(null, '', 'vermontWeekends', 'rainbowWeekends', 'rainbowDays1', 'rainbowDays2', 'rainbowDays3'),
  rotateMonthNames: Joi.boolean().optional().default(true)
})

export interface CalendarRequest extends ValidatedRequestSchema {
  [ContainerTypes.Query]: {
    format: string
    showGrid: boolean
    vermontWeekends: boolean
    showMoonPhases: boolean
    showMoonIllunination: boolean
    showDayNames: boolean
    hideWeekendDayNames: boolean
    theme: string
    rotateMonthNames: boolean
  }
}

app.get('/calendar',
  validator.query(calendarParams),
  async (req: ValidatedRequest<CalendarRequest>, res: Response): Promise<void> => {
    const calendar: Calendar = new Calendar()
    // calendar.optVermontWeekends = true
    calendar.optShowMoonPhase = req.query.showMoonPhases
    calendar.optVermontWeekends = req.query.vermontWeekends
    calendar.optShowGrid = req.query.showGrid
    calendar.gridStroke = 'black'
    calendar.yearFill = 'black'
    calendar.yearX = 1400
    calendar.rotateMonthNames = req.query.rotateMonthNames
    calendar.monthNameFill = 'black'
    calendar.optShowDayNames = req.query.showDayNames
    calendar.hideWeekendDayNames = req.query.hideWeekendDayNames
    calendar.optShowMoonIllumination = req.query.showMoonIllunination

    const theme = req.query.theme
    if (theme === 'vermontWeekends') {
      calendar.optVermontWeekends = true
    } else if (theme === 'rainbowWeekends') {
      calendar.optRainbowWeekends = true
    } else if (theme === 'rainbowDays1') {
      calendar.optRainbowDays1 = true
    } else if (theme === 'rainbowDays2') {
      calendar.optRainbowDays2 = true
    } else if (theme === 'rainbowDays3') {
      calendar.optRainbowDays3 = true
    }

    const svgDom: d3.Selection<HTMLElement, unknown, null, undefined> = calendar.getSvgAsDocumentDom()

    let browser: puppeteer.Browser
    let page: puppeteer.Page | undefined

    if (req.query.format === 'pdf' || req.query.format === 'png') {
      browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
      page = await browser.newPage()
      await page.setContent(svgDom.html())
    }

    if (req.query.format === 'pdf' && page != undefined) {
      const pdf = await page.pdf({ format: 'A1', landscape: true, scale: 2 })

      // set the filename with todays date
      const filename = `calendar-${new Date().toISOString().split('T')[0]}.pdf`

      res.contentType('application/pdf')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${filename}`
      )

      res.send(pdf)
      return
    }

    if (req.query.format === 'png' && page != undefined) {
      const png = await page.screenshot({
        type: 'png',
        fullPage: true
      })

      // set the filename with todays date
      const filename = `calendar-${new Date().toISOString().split('T')[0]}.png`

      res.contentType('image/png')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${filename}`
      )

      res.send(png)
      return
    }

    res.setHeader('Content-Type', 'image/svg+xml')
    res.send(svgDom.html())
  })

app.get('/calendar2', async (req: Request, res: Response): Promise<void> => {
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

app.get('/_ah/warmup', (req: Request, res: Response) => {
  res.sendStatus(204)
})

app.get('/status', (req: Request, res: Response) => {
  let revision: string
  try {
    revision = fs.readFileSync('REVISION').toString().trim()
  } catch (err) {
    revision = fs.readFileSync('.git/HEAD').toString().trim()
    if (revision.includes(':')) {
      revision = fs.readFileSync('.git/' + revision.substring(5)).toString().trim()
    }

    res.send(revision)
  }
}
)
