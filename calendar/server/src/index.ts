import express, { type Express, type Request, type Response } from 'express'
import dotenv from 'dotenv'
import * as suncalc from 'suncalc'
import * as d3 from 'd3'
import { geoOrthographic } from 'd3-geo'
import { JSDOM } from 'jsdom'
import * as emoji from 'node-emoji'
import * as fluent from 'fluentui-emoji-js'
import * as fs from 'fs'
import * as path from 'path'
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
import { vermontMonthlyColors, vermontMonthlyColors2 } from './vermont_weekends'
import Calendar from './Calendar'

dotenv.config()

const app: Express = express()
const port: string | number = process.env.PORT ?? 3000

const DEFAULT_CELL_BG: string = 'rgba(255, 255, 255, 0)'
const WEEKEND_CELL_BG: string = 'rgba(0, 0, 0, 0.1)'
const BORDER_COLOR: string = 'rgba(0, 0, 0, .5)'

const optHighlightWeekends: boolean = false
const optShowDayNames: boolean = true
const optShowWeekendDayNames: boolean = true
const optRainbowDays1: boolean = false
const optRainbowDays2: boolean = false
const optRainbowDays3: boolean = false
const optRainbowWeekends: boolean = false
const optVermontWeekends: boolean = true

const optShowMoonIllumination: boolean = false
const optShowMoonPhase: boolean = true

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

const cellPadding: number = 5
const cellWidth: number = 50
const cellHeight: number = 75
const gridWidth: number = 32 * cellWidth
const gridHeight: number = 12 * cellHeight
const startDate: Date = new Date(2024, 0, 1)

const getDayName = (date: Date): string => {
  const days: string[] = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']
  return days[date.getDay()]
}

const getMonthName = (monthNumber: number): string => {
  const months: string[] = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return months[monthNumber]
}

function temperatureToColor (temp: number): string {
  const temperatureRange = [-10, 110]
  const coldColor = [175, 238, 238] // Soft cold tone
  const warmColor = [255, 99, 71] // Warm red tone

  // Create interpolation functions for each color channel.
  const interpolateRed = d3.interpolate(coldColor[0], warmColor[0])
  const interpolateGreen = d3.interpolate(coldColor[1], warmColor[1])
  const interpolateBlue = d3.interpolate(coldColor[2], warmColor[2])

  // Scale the temperature to the range [0, 1] for interpolation.
  const normalizedTemp = (temp - temperatureRange[0]) / (temperatureRange[1] - temperatureRange[0])

  // Interpolate the color based on the normalized temperature.
  const rgb = [
    Math.round(interpolateRed(normalizedTemp)),
    Math.round(interpolateGreen(normalizedTemp)),
    Math.round(interpolateBlue(normalizedTemp))
  ]

  // Convert the RGB values to a hexadecimal string.
  const hex = rgb.map(value => value.toString(16).padStart(2, '0')).join('')
  return `#${hex}`
}

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
  calendar.optVermontWeekends = true
  calendar.optShowMoonPhase = true
  calendar.optShowGrid = true
  const svgDom: d3.Selection<HTMLElement, unknown, null, undefined> = calendar.getSvgAsDocumentDom()
  res.setHeader('Content-Type', 'image/svg+xml')
  res.send(svgDom.html())
})

app.get('/calendar', async (req: Request, res: Response): Promise<void> => {
  const geoProjection = geoOrthographic()
    .translate([0, 0])
    .scale(10)

  const geoPath = d3.geoPath(geoProjection)
  const geoHemisphere = d3.geoCircle()()

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
  const maxDistance = Math.sqrt(Math.pow(totalRows - 1, 2) + Math.pow(totalColumns - 1, 2))

  for (let row = 0; row < totalRows; row++) {
    let weekendIndex = -1
    for (let col = 0; col < totalColumns; col++) {
      const x = col * cellWidth
      const y = row * cellHeight + 99

      const date = new Date(new Date().getFullYear(), row, col)
      const day = date.getDate()
      const month = date.getMonth()
      const year = date.getFullYear()

      let cellBackgroundColor = DEFAULT_CELL_BG

      let isWeekend = false
      if (date.getDay() == 0 || date.getDay() == 6) {
        isWeekend = true
        weekendIndex++
      }

      if (optHighlightWeekends && date.getMonth() === row) {
        if (date.getDay() == 0 || date.getDay() == 6) {
          cellBackgroundColor = WEEKEND_CELL_BG
        }
      }

      if (optRainbowDays1) {
        const hue = date.getDay() * 30
        cellBackgroundColor = `hsl(${hue}, 100%, 90%)`
      }

      if (optRainbowDays2) {
        const hue = (col / (30)) * 360

        // Assuming saturation and lightness are constant to keep the example simple
        const saturation = 100 // 100% for vibrant colors
        const lightness = 50 // 50% is a balanced lightness for visibility

        // Construct the HSL color string
        cellBackgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
      }

      if (optRainbowDays3) {
        // Calculate Euclidean distance from the bottom right corner
        const distance = Math.sqrt(Math.pow(totalRows - 1 - row, 2) + Math.pow(totalColumns - 1 - col, 2))

        // Normalize distance
        const normalizedDistance = distance / maxDistance

        // Adjust hue based on distance (you can experiment with this part)
        const hue = normalizedDistance * 360

        // Adjust lightness from 50% at the nearest point to 10% at the farthest to create a radial effect
        // You can adjust the range of lightness based on your desired effect
        // const lightness = 50 - (normalizedDistance * 40); // Ranges from 10% to 50%

        // Modify lightness adjustment to ensure colors remain light across the gradient
        // Consider keeping lightness above a minimum threshold that avoids the colors becoming too dark
        const lightnessMin = 80 // Minimum lightness value to avoid dark colors
        const lightnessMax = 95 // Maximum lightness value for vibrant colors
        const lightness = lightnessMin + (1 - normalizedDistance) * (lightnessMax - lightnessMin)

        // Saturation can remain constant or be adjusted similarly
        const saturation = 50 // Keeping saturation constant for vibrant colors

        cellBackgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
      }

      if (optRainbowWeekends) {
        if (date.getDay() == 0 || date.getDay() == 6) {
          const hue = (col / (30)) * 360
          cellBackgroundColor = `hsl(${hue}, 100%, 90%)`
        }
      }

      if (optVermontWeekends) {
        if (isWeekend) {
          cellBackgroundColor = vermontMonthlyColors2[row][weekendIndex]
        }
      }

      if (col === 0) {
        // draw.line(x, y + cellHeight, x + cellWidth, y + cellHeight).stroke(BORDER_COLOR);
        svg.append('text')
          .text(getMonthName(row))
          .attr('x', x)
          .attr('y', y + 60)
          .attr('font-size', '20px')
          .attr('font-family', 'Helvetica')
          .attr('font-weight', 'bold')
          .attr('transform', 'rotate(-25,' + x + ',' + (y + 40) + ')')
      } else {
        svg.append('rect')
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('x', x)
          .attr('y', y)
          .attr('fill', cellBackgroundColor)
          .attr('stroke', BORDER_COLOR)
      }

      // if the month different than row then it's the next month and should be blank
      if (date.getMonth() === row) {
        const dayName = getDayName(date)

        svg.append('text')
          .text(col)
          .attr('x', x + cellPadding)
          .attr('y', y + 14)
          .attr('font-size', '12px')
          .attr('font-family', 'Helvetica')
          .attr('font-weight', 'bold')

        let showDay = optShowDayNames
        if (date.getDay() == 0 || date.getDay() == 6) {
          showDay = optShowWeekendDayNames
        }

        if (showDay) {
          svg.append('text')
            .text(dayName)
            .attr('x', x + cellPadding)
            .attr('y', y + 64)
            .attr('font-size', '12px')
            .attr('font-family', 'Helvetica')
            .attr('font-weight', 'bold')
        }

        if (optShowMoonIllumination) {
          const date = new Date(year, month, day)
          const d3Date = d3.timeDay(date)
          const noon = d3.timeHour.offset(d3Date, 12)
          const moonIllumination = suncalc.getMoonIllumination(noon)
          const moonAngle = 180 - moonIllumination.phase * 360

          svg.append('path')
            .attr('fill', '#000000')
            .attr('d', `${geoProjection.rotate([moonAngle, 0]), geoPath(geoHemisphere)}`)
            .attr('transform', `translate(${x + 35}, ${y + 12}) scale(0.75)`)
        }

        if (optShowMoonPhase) {
          const date = new Date(year, month, day)
          const d3Date = d3.timeDay(date)
          const moonIllumination = suncalc.getMoonIllumination(date)
          const moonPhase = Math.round(moonIllumination.phase * 1e3) / 1e3

          console.log(`moonPhase: ${moonPhase}`)
          const moonY = y - 46
          const moonX = x - 3
          if (moonPhase <= 0.032) {
            await appendEmoji(svg, '🌑', moonX, moonY)
          } else if (moonPhase >= 0.230 && moonPhase <= 0.267) {
            await appendEmoji(svg, '🌓', moonX, moonY)
          } else if (moonPhase >= 0.475 && moonPhase <= 0.52) {
            await appendEmoji(svg, '🌕', moonX, moonY)
          } else if (moonPhase >= 0.73 && moonPhase <= 0.76) {
            await appendEmoji(svg, '🌗', moonX, moonY)
          }
        }

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
