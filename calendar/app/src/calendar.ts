import { JSDOM } from 'jsdom'
import * as d3 from 'd3'
import { geoOrthographic } from 'd3-geo'
import * as suncalc from 'suncalc'
import { vermontMonthlyColors2 } from './vermont_weekends'
import { type Span, trace } from '@opentelemetry/api'
import { z } from 'zod'


type CalendarTheme = "" | "vermontWeekends" | "rainbowWeekends" | "rainbowDays1" | "rainbowDays2" | "rainbowDays3"

const CalendarSchema = z.object({
  cellBackgroundColor: z.string().default('white'),
  weekendBackgroundColor: z.string().default('grey'),
  startDate: z.date().default(new Date()),
  headerHeight: z.number().default(100),
  yearX: z.number().default(0),
  yearY: z.number().default(0),
  yearFill: z.string().default('black'),
  yearFontSize: z.string().default('12px'),
  yearFontFamily: z.string().default('Arial'),
  yearFontWeight: z.string().default('normal'),
  monthNameFill: z.string().default('black'),
  monthNameFontSize: z.string().default('12px'),
  monthNameFontFamily: z.string().default('Arial'),
  monthNameFontWeight: z.string().default('normal'),
  rotateMonthNames: z.boolean().default(false),
  optHighlightWeekends: z.boolean().default(false),
  optShowDayNames: z.boolean().default(false),
  hideWeekendDayNames: z.boolean().default(false),
  theme: z.enum(["", "vermontWeekends", "rainbowWeekends", "rainbowDays1", "rainbowDays2", "rainbowDays3"]).default(""),
  optShowMoonIllumination: z.boolean().default(false),
  optShowMoonPhase: z.boolean().default(false),
  optShowGrid: z.boolean().default(false),
  gridStroke: z.string().default('black'),
  lat: z.number().optional(),
  lng: z.number().optional()
})

type Calendar = z.infer<typeof CalendarSchema>

const tracer = trace.getTracer('Calendar')
const geoProjection = geoOrthographic().translate([0, 0]).scale(20)
const geoPath = d3.geoPath(geoProjection)
const geoHemisphere = d3.geoCircle()()
const moonPhaseSize = 7
const moonPhaseGeoProjection = geoOrthographic().translate([0, 0])
  .scale(moonPhaseSize)
const TAU = Math.PI * 2
const maxDistance = Math.sqrt(Math.pow(12, 2) + Math.pow(31, 2))

const cellWidth = 50
const cellHeight = 75
const cellPadding = 5

const cellBackgroundColor = 'rgba(255, 255, 255, 0)'
const weekendBackgroundColor = 'rgba(0, 0, 0, 0.1)'

// start on the first day of the current year
const startDate: Date = new Date(new Date().getFullYear(), 0, 1)

const gridWidth: number = 32 * cellWidth
const gridHeight: number = 12 * cellHeight

const getDayName = (date: Date): string => {
  const days: string[] = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']
  return days[date.getDay()]
}

const getMonthName = (monthNumber: number): string => {
  const months: string[] = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return months[monthNumber]
}

const generateSvg = (documentBody: d3.Selection<HTMLElement, unknown, null, undefined>, calendar: Calendar): d3.Selection<SVGSVGElement, unknown, null, undefined> => {
  const width = gridWidth
  const height = gridHeight + calendar.headerHeight
  const totalColumns = 32
  const totalRows = 12

  const year = startDate.getFullYear()

  const svg = documentBody.append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  // year header
  svg.append('text')
    .text(year)
    .attr('x', calendar.yearX)
    .attr('y', calendar.yearY)
    .attr('fill', calendar.yearFill)
    .attr('font-size', calendar.yearFontSize)
    .attr('font-family', calendar.yearFontFamily)
    .attr('font-weight', calendar.yearFontWeight)

  for (let row = 0; row < totalRows; row++) {
    let weekendIndex = -1
    const moonPhases: string[] = []
    for (let day = 0; day < totalColumns; day++) {
      const x = day * cellWidth
      const y = row * cellHeight + 99

      const date = new Date(year, row, day)
      const month = date.getMonth()
      const dayOfWeek = date.getDay()

      // Set the time to 9:00 PM local time initially
      date.setHours(21, 0, 0, 0) // 21:00 hours, 0 minutes, 0 seconds, 0 milliseconds

      // Calculate the time zone offset for EST (UTC-5)
      const estOffset = 5 * 60 // EST offset in minutes
      const localOffset = date.getTimezoneOffset() // Local time zone offset in minutes
      const totalOffset = estOffset - localOffset // Total offset from local time to EST

      // Adjust the date to EST
      date.setMinutes(date.getMinutes() + totalOffset)

      // Convert the date to EST string
      const estDateString = date.toLocaleString('en-US', { timeZone: 'America/New_York' })

      const estDate = new Date(estDateString)

      let isWeekend = false
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        isWeekend = true
        weekendIndex++
      }

      if (day === 0) {
        appendMonthCell(svg, calendar, row, x, y)
        continue
      }

      if (month !== row) {
        continue
      }

      // cell background
      const cellBackgroundColor: string = getBackgroundColor(calendar, estDate, isWeekend, weekendIndex)
      svg.append('rect')
        .attr('width', cellWidth)
        .attr('height', cellHeight)
        .attr('x', x)
        .attr('y', y)
        .attr('fill', cellBackgroundColor)

      // day number
      svg.append('text')
        .text(day)
        .attr('x', x + cellPadding)
        .attr('y', y + 14)
        .attr('font-size', '12px')
        .attr('font-family', 'Helvetica')

      appendDayName(svg, calendar, x, y, estDate)

      if (calendar.optShowMoonIllumination) {
        appendMoon(svg, calendar, estDate, x, y)
      }

      if (calendar.optShowMoonPhase) {
        appendMoonPhase(svg, estDate, x, y, moonPhases)
      }

      if (calendar.optShowGrid) {
        svg.append('rect')
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('x', x)
          .attr('y', y)
          .attr('stroke', calendar.gridStroke)
          .attr('fill', 'none')
      }
    }
  }

  if (calendar.optShowGrid) {
    svg.append('rect')
      .attr('width', cellWidth * 31)
      .attr('height', cellHeight * 12 + 2)
      .attr('stroke-location', 'inside')
      .attr('x', cellWidth)
      .attr('y', calendar.headerHeight - 1)
      .attr('stroke', calendar.gridStroke)
      .attr('stroke-width', 1)
      .attr('fill', 'none')
  }

  return svg
}

const getBackgroundColor = (calendar: Calendar, date: Date, isWeekend: boolean, weekendIndex: number): string => {
  const dayNum = date.getDate()
  let backgroundColor = calendar.cellBackgroundColor

  if (calendar.theme == 'rainbowDays1') {
    const hue = date.getDay() * 30
    backgroundColor = `hsl(${hue}, 100%, 90%)`
  }

  if (calendar.theme == 'rainbowDays2' || calendar.theme == 'rainbowDays3') {
    // Calculate hue once and store it in a variable
    const hue = (dayNum / (30)) * 360

    if (calendar.theme == 'rainbowDays2') {
      const saturation = 100
      const lightness = 50
      backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }

    if (calendar.theme == 'rainbowDays3') {
      // Use the pre-calculated maxDistance
      const distance = Math.sqrt(Math.pow(12 - date.getMonth(), 2) + Math.pow(30 - dayNum, 2))
      const normalizedDistance = distance / maxDistance
      const lightnessMin = 80
      const lightnessMax = 80
      const lightness = lightnessMin + (1 - normalizedDistance) * (lightnessMax - lightnessMin)
      const saturation = 100
      backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }
  }

  if (isWeekend) {
    if (calendar.optHighlightWeekends) {
      backgroundColor = calendar.weekendBackgroundColor
    }

    if (calendar.theme == 'rainbowWeekends') {
      const hue = (date.getDate() / 30) * 360
      backgroundColor = `hsl(${hue}, 100%, 90%)`
    }

    if (calendar.theme == 'vermontWeekends') {
      backgroundColor = vermontMonthlyColors2[date.getMonth()][weekendIndex]
    }
  }

  return backgroundColor
}

const appendMonthCell = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, calendar: Calendar, row: number, x: number, y: number): void => {
  // NOSONAR
  // draw.line(x, y + cellHeight, x + cellWidth, y + cellHeight).stroke(BORDER_COLOR);
  const textObj = svg.append('text')
    .text(getMonthName(row))
    .attr('x', x)
    .attr('y', y + 50)
    .attr('fill', calendar.monthNameFill)
    .attr('font-size', calendar.monthNameFontSize)
    .attr('font-family', calendar.monthNameFontFamily)
    .attr('font-weight', calendar.monthNameFontWeight)

  if (calendar.rotateMonthNames) {
    textObj.attr('transform', 'rotate(-25,' + x + ',' + (y + 40) + ')')
  }
}

const appendDayName = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, calendar: Calendar, x: number, y: number, date: Date): void => {
  let showDay = calendar.optShowDayNames
  const day = date.getDay()
  if (calendar.hideWeekendDayNames && (day === 0 || day === 6)) {
    showDay = false
  }

  if (showDay) {
    const dayName = getDayName(date)
    svg.append('text')
      .text(dayName)
      .attr('x', x + cellPadding)
      .attr('y', y + 64)
      .attr('font-size', '12px')
      .attr('font-family', 'Helvetica')
      .attr('font-weight', 'bold')
  }
}

// traced version of append moon function
const appendMoon = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, calendar: Calendar, date: Date, x: number, y: number): void => {
  tracer.startActiveSpan('appendMoon', (span: Span) => {
    _appendMoon(svg, calendar, date, x, y)
    span.end()
  })
}

const _appendMoon = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, calendar: Calendar, date: Date, x: number, y: number): void => {
  const moonIllumination = suncalc.getMoonIllumination(date)
  const lightAngle = 180 - moonIllumination.phase * 360

  const { parallacticAngle } = suncalc.getMoonPosition(
    date,
    calendar.lat,
    calendar.lng
  )
  const rotationZ = ((moonIllumination.angle - parallacticAngle) / TAU) * 360 * -1

  svg.append('circle')
    .attr('r', 20)
    .attr('fill', '#c1c1c1')
    .attr('transform', `translate(${x + 24}, ${y + 42})`)

  // noinspection CommaExpressionJS
  // NOSONAR
  svg.append('path')
    .attr('fill', '#FFFFFF')
    .attr('d', `${geoProjection.rotate([lightAngle, 0, rotationZ]), geoPath(geoHemisphere)}`)
    .attr('transform', `translate(${x + 24}, ${y + 42})`)

  svg.append('circle')
    .attr('r', 20)
    .attr('fill', 'none')
    .attr('stroke', '#c1c1c1')
    .attr('transform', `translate(${x + 24}, ${y + 42})`)
}

// traced version of append moon phase function
const appendMoonPhase = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, date: Date, x: number, y: number, moonPhases: string[]): void => {
  tracer.startActiveSpan('appendMoonPhase', (span: Span) => {
    _appendMoonPhase(svg, date, x, y, moonPhases)
    span.end()
  })
}

const _appendMoonPhase = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, date: Date, x: number, y: number, moonPhases: string[]): void => {
  const geoPath = d3.geoPath(moonPhaseGeoProjection)
  const geoHemisphere = d3.geoCircle()()

  const moonIllumination = suncalc.getMoonIllumination(date)
  const moonAngle = 180 - moonIllumination.phase * 360

  const moonPhase = Math.round(moonIllumination.phase * 1e3) / 1e3
  let moonPhaseName: string | undefined

  if (moonPhase <= 0.032) {
    moonPhaseName = 'new moon'
  } else if (moonPhase >= 0.22 && moonPhase <= 0.3) {
    moonPhaseName = 'first quarter'
  } else if (moonPhase >= 0.475 && moonPhase <= 0.52) {
    moonPhaseName = 'full moon'
  } else if (moonPhase >= 0.73 && moonPhase <= 0.76) {
    moonPhaseName = 'last quarter'
  }

  let showMoon = false
  if (moonPhaseName !== undefined) {
    if (!moonPhases.includes(moonPhaseName)) {
      moonPhases.push(moonPhaseName)
      showMoon = true
    }
  }
  if (showMoon) {
    const moonX = x + 35
    const moonY = y + 12
    svg.append('circle')
      .attr('r', moonPhaseSize)
      .attr('fill', '#c1c1c1')
      .attr('transform', `translate(${moonX}, ${moonY})`)

    geoProjection.rotate([moonAngle, 0])

    // noinspection CommaExpressionJS
    // NOSONAR
    svg.append('path')
      .attr('fill', '#FFFFFF')
      .attr('d', `${geoProjection.rotate([moonAngle, 0]), geoPath(geoHemisphere)}`)
      .attr('transform', `translate(${moonX}, ${moonY})`)

    svg.append('circle')
      .attr('r', moonPhaseSize)
      .attr('fill', 'none')
      .attr('stroke', '#c1c1c1')
      .attr('transform', `translate(${moonX}, ${moonY})`)
  }
}

const getSvgAsDocumentDom = (calendar: Calendar): d3.Selection<HTMLElement, unknown, null, undefined> => {
  return tracer.startActiveSpan('getSvgAsDocumentDom', (span: Span) => {
    span.setAttribute('calendar', JSON.stringify(calendar))
    console.info('calendar', JSON.stringify(calendar))

    const dom = new JSDOM('<!DOCTYPE html><body></body>')
    const documentBody = d3.select(dom.window.document.body)
    generateSvg(documentBody, calendar)
    span.end()

    return documentBody
  })
}

const getDefaultCalendar = (): Calendar => {
  return {
    headerHeight: 100,
    yearX: 50,
    yearY: 80,
    yearFill: '#a1a1a1',
    yearFontSize: '80px',
    yearFontFamily: 'Helvetica',
    yearFontWeight: 'bold',

    monthNameFill: '#a1a1a1',
    monthNameFontSize: '20px',
    monthNameFontFamily: 'Helvetica',
    monthNameFontWeight: 'bold',
    rotateMonthNames: false,

    optHighlightWeekends: false,
    optShowDayNames: false,
    hideWeekendDayNames: false,
    optShowMoonIllumination: false,
    optShowMoonPhase: false,

    optShowGrid: false,
    gridStroke: '#c1c1c1',
    lat: 44.25644,
    lng: -72.26793,
    cellBackgroundColor,
    weekendBackgroundColor,
    startDate,
    theme: ""
  }
}

export {
  type Calendar,
  type CalendarTheme,
  CalendarSchema,
  getSvgAsDocumentDom,
  getDefaultCalendar
}
