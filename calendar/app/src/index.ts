import express, { type Express, type Request, type Response } from 'express'
import bodyParser from "body-parser";
import dotenv from 'dotenv'
import compression from 'compression'
import * as d3 from 'd3'
import { JSDOM } from 'jsdom'
import * as emoji from 'node-emoji'
import * as fluent from 'fluentui-emoji-js'
import { getCalendar } from "./calendar-api";

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
import * as fs from 'fs'
import { getDefaultCalendar } from "~/calendar";
import {
  type ContainerTypes,
  createValidator,
  type ValidatedRequest,
  type ValidatedRequestSchema
} from 'express-joi-validation'
import Joi from "joi";

dotenv.config()

const app: Express = express()
app.use(bodyParser.json({limit: "100mb"}))
app.use(bodyParser.urlencoded({limit:"50mb", extended: true}))

// allow CORS from anywhere
app.use((req: Request, res: Response, next: () => void): void => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.use(compression())

const validator = createValidator()

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

app.post('/calendar', getCalendar)

/* eslint-disable @typescript-eslint/no-misused-promises */
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
            await appendEmoji(svg, '👻', x, y).then(() => {}).catch((err) => { console.error(err) })
          }
        }

        if (optPersonalHolidays) {
          const holiday = personalHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y).then(() => {}).catch((err) => { console.error(err) })
          }
        }

        if (optUSFederalHolidays !== undefined) {
          const holiday = federalHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y).then(() => {}).catch((err) => { console.error(err) })
          }
        }

        if (optCanadianHolidays !== undefined) {
          const holiday = canadianHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y).then(() => {}).catch((err) => { console.error(err) })
          }
        }

        if (optOtherHolidays !== undefined) {
          const holiday = otherHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y).then(() => {}).catch((err) => { console.error(err) })
          }
        }

        if (optCatholicHolidays !== undefined) {
          const holiday = catholicHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y).then(() => {}).catch((err) => { console.error(err) })
          }
        }

        if (optJewishHolidays !== undefined) {
          const holiday = jewishHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y).then(() => {}).catch((err) => { console.error(err) })
          }
        }

        if (optHinduHolidays !== undefined) {
          const holiday = hinduHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y).then(() => {}).catch((err) => { console.error(err) })
          }
        }

        if (optIslamicHolidays !== undefined) {
          const holiday = islamicHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y).then(() => {}).catch((err) => { console.error(err) })
          }
        }

        if (optChineseHolidays !== undefined) {
          const holiday = chineseHolidays.find(holiday => holiday.date.getTime() === date.getTime())
          if (holiday !== undefined) {
            await appendEmoji(svg, holiday.emoji, x, y).then(() => {}).catch((err) => { console.error(err) })
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
