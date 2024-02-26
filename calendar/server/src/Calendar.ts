import { JSDOM } from 'jsdom'
import * as d3 from 'd3'
import { geoOrthographic } from 'd3-geo'
import * as suncalc from 'suncalc'
import { type GeoProjection } from 'd3'
import { vermontMonthlyColors2 } from './vermont_weekends'

class Calendar {
  dom: JSDOM
  documentBody: d3.Selection<HTMLElement, unknown, null, undefined>

  cellWidth: number = 50
  cellHeight: number = 75
  cellPadding: number = 5
  gridWidth: number = 32 * this.cellWidth
  gridHeight: number = 12 * this.cellHeight

  cellBackgroundColor: string = 'rgba(255, 255, 255, 0)'
  weekendBackgroundColor: string = 'rgba(0, 0, 0, 0.1)'

  // start on the first day of the current year
  startDate: Date = new Date(new Date().getFullYear(), 0, 1)

  headerHeight: number = 100
  yearX: number = 50
  yearY: number = 80
  yearFill: string = '#a1a1a1'
  yearFontSize: string = '80px'
  yearFontFamily: string = 'Helvetica'
  yearFontWeight: string = 'bold'

  monthNameFill: string = '#a1a1a1'
  monthNameFontSize: string = '20px'
  monthNameFontFamily: string = 'Helvetica'
  monthNameFontWeight: string = 'bold'
  rotateMonthNames: boolean = false

  optHighlightWeekends: boolean = false
  optShowDayNames: boolean = false
  hideWeekendDayNames: boolean = false
  optRainbowDays1: boolean = false
  optRainbowDays2: boolean = false
  optRainbowDays3: boolean = false
  optRainbowWeekends: boolean = false
  optVermontWeekends: boolean = false
  optShowMoonIllumination: boolean = false
  optShowMoonPhase: boolean = false

  optShowGrid: boolean = false
  gridStroke: string = '#c1c1c1'

  constructor () {
    this.dom = new JSDOM('<!DOCTYPE html><body></body>')
    this.documentBody = d3.select(this.dom.window.document.body)
  }

  getDayName = (date: Date): string => {
    const days: string[] = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']
    return days[date.getDay()]
  }

  getMonthName = (monthNumber: number): string => {
    const months: string[] = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return months[monthNumber]
  }

  getSvg = (): d3.Selection<SVGSVGElement, unknown, null, undefined> => {
    const width = this.gridWidth
    const height = this.gridHeight + this.headerHeight
    const totalColumns = 32
    const totalRows = 12

    const year = this.startDate.getFullYear()

    const svg = this.documentBody.append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')

    // year header
    svg.append('text')
      .text(year)
      .attr('x', this.yearX)
      .attr('y', this.yearY)
      .attr('fill', this.yearFill)
      .attr('font-size', this.yearFontSize)
      .attr('font-family', this.yearFontFamily)
      .attr('font-weight', this.yearFontWeight)

    for (let row = 0; row < totalRows; row++) {
      let weekendIndex = -1
      const moonPhases: string[] = []
      for (let day = 0; day < totalColumns; day++) {
        const x = day * this.cellWidth
        const y = row * this.cellHeight + 99

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
        const estDateString = date.toLocaleString("en-US", {timeZone: "America/New_York"});

        const estDate = new Date(estDateString);

        let isWeekend = false
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          isWeekend = true
          weekendIndex++
        }

        if (day === 0) {
          this.appendMonthCell(svg, row, x, y)
          continue
        }

        if (month !== row) {
          continue
        }

        // cell background
        const cellBackgroundColor: string = this.getBackgroundColor(estDate, isWeekend, weekendIndex)
        svg.append('rect')
          .attr('width', this.cellWidth)
          .attr('height', this.cellHeight)
          .attr('x', x)
          .attr('y', y)
          .attr('fill', cellBackgroundColor)

        // day number
        svg.append('text')
          .text(day)
          .attr('x', x + this.cellPadding)
          .attr('y', y + 14)
          .attr('font-size', '12px')
          .attr('font-family', 'Helvetica')

        this.appendDayName(svg, x, y, estDate)

        if (this.optShowMoonIllumination) {
          this.appendMoon(svg, estDate, x, y)
        }

        if (this.optShowMoonPhase) {
          this.appendMoonPhase(svg, estDate, x, y, moonPhases)
        }

        if (this.optShowGrid) {
          svg.append('rect')
            .attr('width', this.cellWidth)
            .attr('height', this.cellHeight)
            .attr('x', x)
            .attr('y', y)
            .attr('stroke', this.gridStroke)
            .attr('fill', 'none')
        }
      }
    }

    if (this.optShowGrid) {
      svg.append('rect')
        .attr('width', this.cellWidth * 31)
        .attr('height', this.cellHeight * 12 + 2)
        .attr('stroke-location', 'inside')
        .attr('x', this.cellWidth)
        .attr('y', this.headerHeight - 1)
        .attr('stroke', this.gridStroke)
        .attr('stroke-width', 1)
        .attr('fill', 'none')
    }

    return svg
  }

  getSvgAsDocument = (): JSDOM => {
    return this.dom
  }

  getSvgAsDocumentDom = (): d3.Selection<HTMLElement, unknown, null, undefined> => {
    this.getSvg()
    return this.documentBody
  }

  getBackgroundColor = (date: Date, isWeekend: boolean, weekendIndex: number): string => {
    const dayNum = date.getDate()
    let backgroundColor = this.cellBackgroundColor

    if (this.optRainbowDays1) {
      const hue = date.getDay() * 30
      backgroundColor = `hsl(${hue}, 100%, 90%)`
    }

    if (this.optRainbowDays2) {
      const hue = (dayNum / (30)) * 360

      // Assuming saturation and lightness are constant to keep the example simple
      const saturation = 100 // 100% for vibrant colors
      const lightness = 50 // 50% is a balanced lightness for visibility

      // Construct the HSL color string
      backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }

    if (this.optRainbowDays3) {
      const maxDistance = Math.sqrt(Math.pow(12, 2) + Math.pow(31, 2))

      // Calculate Euclidean distance from the bottom right corner
      const distance = Math.sqrt(Math.pow(12 - date.getMonth(), 2) + Math.pow(30 - dayNum, 2))

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
      const lightnessMax = 80 // Maximum lightness value for vibrant colors
      const lightness = lightnessMin + (1 - normalizedDistance) * (lightnessMax - lightnessMin)

      // Saturation can remain constant or be adjusted similarly
      const saturation = 100 // Keeping saturation constant for vibrant colors

      backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }

    if (this.optHighlightWeekends && isWeekend) {
      backgroundColor = this.weekendBackgroundColor
    }

    if (this.optRainbowWeekends && isWeekend) {
      const hue = (date.getDate() / 30) * 360
      backgroundColor = `hsl(${hue}, 100%, 90%)`
    }

    if (isWeekend && this.optVermontWeekends) {
      backgroundColor = vermontMonthlyColors2[date.getMonth()][weekendIndex]
    }

    return backgroundColor
  }

  appendMonthCell = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, row: number, x: number, y: number): void => {
    // NOSONAR
    // draw.line(x, y + cellHeight, x + cellWidth, y + cellHeight).stroke(BORDER_COLOR);
    const textObj = svg.append('text')
      .text(this.getMonthName(row))
      .attr('x', x)
      .attr('y', y + 50)
      .attr('fill', this.monthNameFill)
      .attr('font-size', this.monthNameFontSize)
      .attr('font-family', this.monthNameFontFamily)
      .attr('font-weight', this.monthNameFontWeight)

    if (this.rotateMonthNames) {
      textObj.attr('transform', 'rotate(-25,' + x + ',' + (y + 40) + ')')
    }
  }

  appendDayName = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, date: Date): void => {
    let showDay = this.optShowDayNames
    const day = date.getDay()
    if (this.hideWeekendDayNames && (day === 0 || day === 6)) {
      showDay = false
    }

    if (showDay) {
      const dayName = this.getDayName(date)
      svg.append('text')
        .text(dayName)
        .attr('x', x + this.cellPadding)
        .attr('y', y + 64)
        .attr('font-size', '12px')
        .attr('font-family', 'Helvetica')
        .attr('font-weight', 'bold')
    }
  }

  appendMoon = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, date: Date, x: number, y: number): void => {
    const lat = 44.25644
    const lng = -72.26793

    const geoProjection: GeoProjection = geoOrthographic()
      .translate([0, 0])
      .scale(20)

    const moonIllumination = suncalc.getMoonIllumination(date)
    const lightAngle = 180 - moonIllumination.phase * 360

    const { parallacticAngle } = suncalc.getMoonPosition(
      date,
      lat,
      lng
    )
    const TAU = Math.PI * 2
    const rotationZ = ((moonIllumination.angle - parallacticAngle) / TAU) * 360 * -1

    const geoPath = d3.geoPath(geoProjection)
    const geoHemisphere = d3.geoCircle()()

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

  appendMoonPhase = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, date: Date, x: number, y: number, moonPhases: string[]): void => {
    const moonSize = 7

    const geoProjection = geoOrthographic()
      .translate([0, 0])
      .scale(moonSize)

    const geoPath = d3.geoPath(geoProjection)
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

    let showMoon: boolean = false
    if (moonPhaseName) {
      if (!moonPhases.includes(moonPhaseName)) {
        moonPhases.push(moonPhaseName)
        showMoon = true
      }
    }
    if (showMoon) {
      const moonX = x + 35
      const moonY = y + 12
      svg.append('circle')
        .attr('r', moonSize)
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
        .attr('r', moonSize)
        .attr('fill', 'none')
        .attr('stroke', '#c1c1c1')
        .attr('transform', `translate(${moonX}, ${moonY})`)
    }
  }
}

export default Calendar
