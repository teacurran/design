import express, { type Express, type Request, type Response } from 'express'
import dotenv from 'dotenv'
import compression from 'compression'
import * as d3 from 'd3'
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
import { optimize } from 'svgo'
import { createHTTPServer } from '@trpc/server/adapters/standalone'

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
import { getDefaultCalendar, getSvgAsDocumentDom } from './calendar'
import * as fs from 'fs'
import { type Span, trace } from '@opentelemetry/api'
import { calendarRouter } from './calendar-rpc'

dotenv.config()

const app: Express = express()
const validator = createValidator()
const tracer = trace.getTracer('API')

// allow CORS from anywhere
app.use((req: Request, res: Response, next: () => void): void => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.use(compression())

const port: string | number = process.env.PORT ?? 3000

const optFriday13th = true
const optPersonalHolidays = true
const optUSFederalHolidays = false
const optCanadianHolidays = false
const optOtherHolidays = false
const optJewishHolidays = false
const optIslamicHolidays = false
const optCatholicHolidays = false
const optHinduHolidays = false
const optChineseHolidays = false

const cellWidth = 50
const cellHeight = 75
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
  rotateMonthNames: Joi.boolean().optional().default(true),
  optimize: Joi.boolean().optional().default(false)
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
    optimize: boolean
  }
}

app.get('/calendar',
  validator.query(calendarParams),
  async (req: ValidatedRequest<CalendarRequest>, res: Response) => {
    try {
      const calendar = getDefaultCalendar()

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

      const svgDom: d3.Selection<HTMLElement, unknown, null, undefined> = getSvgAsDocumentDom(calendar)
      let svg = svgDom.html()

      let browser: puppeteer.Browser
      let page: puppeteer.Page | undefined
      if (req.query.optimize) {
        tracer.startActiveSpan('optimize', (span: Span) => {
          const result = optimize(svg, {
            multipass: true,
            plugins: [
              {
                name: 'preset-default',
                params: {
                  overrides: {
                    removeViewBox: false
                  }
                }
              }
            ]
          })
          svg = result.data
          span.end()
        })
      }

      if (req.query.format === 'pdf' || req.query.format === 'png') {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
        page = await browser.newPage()
        await page.setContent(svg)
      }

      if (req.query.format === 'pdf' && page !== undefined) {
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

      if (req.query.format === 'png' && page !== undefined) {
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
      res.send(svg)
    } catch (error) {
      console.error(error)
      res.status(500).send('An error occurred while generating the PDF.')
    }
  })

app.get('/calendar2', async (req: Request, res: Response): Promise<void> => {
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
        if (optFriday13th !== undefined) {
          if (date.getDay() === 5 && date.getDate() === 13) {
            await appendEmoji(svg, '👻', x, y)
          }
        }

        if (optPersonalHolidays) {
          const holiday = personalHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optUSFederalHolidays !== undefined) {
          const holiday = federalHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optCanadianHolidays !== undefined) {
          const holiday = canadianHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optOtherHolidays !== undefined) {
          const holiday = otherHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optCatholicHolidays !== undefined) {
          const holiday = catholicHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optJewishHolidays !== undefined) {
          const holiday = jewishHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optHinduHolidays !== undefined) {
          const holiday = hinduHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optIslamicHolidays !== undefined) {
          const holiday = islamicHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y)
          }
        }

        if (optChineseHolidays !== undefined) {
          const holiday = chineseHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
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
})

const server = createHTTPServer({
  router: calendarRouter
})

server.listen(4000)
