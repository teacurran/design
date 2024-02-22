import {JSDOM} from "jsdom";
import * as d3 from "d3";
import {geoOrthographic} from "d3-geo";
import * as suncalc from "suncalc";
import {GeoProjection} from "d3";
import {vermontMonthlyColors2} from "./vermont_weekends";

class Calendar {
  dom: JSDOM;
  documentBody: d3.Selection<HTMLElement, unknown, null, undefined>;

  cellPadding: number = 5
  cellWidth: number = 50
  cellHeight: number = 75
  gridWidth: number = 32 * this.cellWidth
  gridHeight: number = 12 * this.cellHeight


  cellBackgroundColor: string = 'rgba(255, 255, 255, 0)'
  weekendBackgroundColor: string = 'rgba(0, 0, 0, 0.1)'
  borderColor: string = 'rgba(0, 0, 0, .5)'

  // start on the first day of the current year
  startDate: Date = new Date(new Date().getFullYear(), 0, 1)

  headerHeight: number = 100
  yearX: number = 50
  yearY: number = 80
  yearFill: string = "#a1a1a1"
  yearFontSize: string = "80px"
  yearFontFamily: string = "Helvetica"
  yearFontWeight: string = "bold"

  monthNameFill: string = "#a1a1a1"
  monthNameFontSize: string = "20px"
  monthNameFontFamily: string = "Helvetica"
  monthNameFontWeight: string = "bold"

  optHighlightWeekends: boolean = false;
  optShowDayNames: boolean = true;
  optShowWeekendDayNames: boolean = true;
  optRainbowDays1: boolean = false;
  optRainbowDays2: boolean = false;
  optRainbowDays3: boolean = false;
  optRainbowWeekends: boolean = false;
  optVermontWeekends: boolean = true;
  optShowMoonIllumination: boolean = false;
  optShowMoonPhase: boolean = true;

  constructor() {
    this.dom = new JSDOM('<!DOCTYPE html><body></body>')
    this.documentBody = d3.select(this.dom.window.document.body)
  }

  getDayName = (date: Date): string => {
    const days: string[] = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']
    return days[date.getDay()]
  };

  getMonthName = (monthNumber: number): string => {
    const months: string[] = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return months[monthNumber]
  };

  getSvg = (): d3.Selection<SVGSVGElement, unknown, null, undefined> => {
    const width = this.gridWidth;
    const height = this.gridHeight + this.headerHeight;

    const svg = this.documentBody.append("svg")
      .attr("width", width)
      .attr("height", height);
    svg.attr("xmlns", "http://www.w3.org/2000/svg");

    svg.append("text")
      .text(this.startDate.getFullYear())
      .attr("x", this.yearX)
      .attr("y", this.yearY)
      .attr("fill", this.yearFill)
      .attr("font-size", this.yearFontSize)
      .attr("font-family", this.yearFontFamily)
      .attr("font-weight", this.yearFontWeight);

    const totalColumns = 32;
    const totalRows = 12;

    for (let row = 0; row < totalRows; row++) {
      let weekendIndex = -1;
      for (let day = 0; day < totalColumns; day++) {
        const x = day * this.cellWidth
        const y = row * this.cellHeight + 99

        const date = new Date(new Date().getFullYear(), row, day)
        const month = date.getMonth()
        const year = date.getFullYear()

        // Set the time to 9:00 PM local time initially
        date.setHours(21, 0, 0, 0); // 21:00 hours, 0 minutes, 0 seconds, 0 milliseconds

        // Calculate the time zone offset for EST (UTC-5)
        const estOffset = 5 * 60; // EST offset in minutes
        const localOffset = date.getTimezoneOffset(); // Local time zone offset in minutes
        const totalOffset = estOffset - localOffset; // Total offset from local time to EST

        // Adjust the date to EST
        date.setMinutes(date.getMinutes() + totalOffset);

        let isWeekend = false;
        if (date.getDay() == 0 || date.getDay() == 6) {
          isWeekend = true
          weekendIndex++
        }

        let cellBackgroundColor: string = this.getBackgroundColor(date, isWeekend, weekendIndex)

        if (day === 0) {
          this.appendMonthCell(svg, row, x, y)
          continue
        }

        if (date.getMonth() != row) {
          continue
        }

        // cell background
        svg.append("rect")
          .attr("width", this.cellWidth)
          .attr("height", this.cellHeight)
          .attr("x", x)
          .attr("y", y)
          .attr("fill", cellBackgroundColor);

        // day number
        svg.append("text")
          .text(day)
          .attr("x", x + 5)
          .attr("y", y + 14)
          .attr("font-size", "12px")
          .attr("font-family", "Helvetica");

        if (this.optShowMoonIllumination) {
          this.appendMoon(svg, date, x, y)
        }

        if (this.optShowMoonPhase) {
          //this.appendMoonPhase(svg, date, x, y)
        }

      }
    }

    return svg;
  }

  getSvgAsDocument = (): JSDOM => {
    return this.dom
  }

  getSvgAsDocumentDom = (): d3.Selection<HTMLElement, unknown, null, undefined> => {
    this.getSvg()
    return this.documentBody
  }

  getBackgroundColor = (date: Date, isWeekend: boolean, weekendIndex: number): string => {
    let backgroundColor = this.cellBackgroundColor

    if (this.optHighlightWeekends && isWeekend) {
      backgroundColor = this.weekendBackgroundColor
    }

    if (this.optRainbowWeekends && isWeekend) {
      const hue = (date.getDate() / 30) * 360
      backgroundColor = `hsl(${hue}, 100%, 90%)`
    }

    if (isWeekend && this.optVermontWeekends) {
      backgroundColor = vermontMonthlyColors2[date.getMonth()][weekendIndex];
    }

    return backgroundColor
  }

  appendMonthCell = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, row: number, x: number, y: number): void => {
    // draw.line(x, y + cellHeight, x + cellWidth, y + cellHeight).stroke(BORDER_COLOR);
    svg.append("text")
      .text(this.getMonthName(row))
      .attr("x", x)
      .attr("y", y + 50)
      .attr("fill", this.monthNameFill)
      .attr("font-size", this.monthNameFontSize)
      .attr("font-family", this.monthNameFontFamily)
      .attr("font-weight", this.monthNameFontWeight)
  }

  appendMoon = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, date: Date, x: number, y: number): void => {
    const lat = 44.25644;
    const lng = -72.26793;

    const geoProjection: GeoProjection = geoOrthographic()
      .translate([0, 0])
      .scale(20);

    const moonIllumination = suncalc.getMoonIllumination(date)
    const lightAngle = 180 - moonIllumination.phase * 360
    const darkAngle = lightAngle + 180

    const { parallacticAngle } = suncalc.getMoonPosition(
      date,
      lat,
      lng
    );
    const TAU = Math.PI * 2
    const rotationZ = ((moonIllumination.angle - parallacticAngle) / TAU) * 360 * -1

    const geoPath = d3.geoPath(geoProjection)
    const geoHemisphere = d3.geoCircle()()

    svg.append("circle")
      .attr("r", 20)
      .attr("fill", "#c1c1c1")
      .attr("transform", `translate(${x + 24}, ${y + 42})`);

    svg.append("path")
      .attr("fill", "#FFFFFF")
      .attr("d", `${geoProjection.rotate([lightAngle, 0, rotationZ]), geoPath(geoHemisphere)}`)
      .attr("transform", `translate(${x + 24}, ${y + 42})`);

    svg.append("circle")
      .attr("r", 20)
      .attr("fill", "none")
      .attr("stroke", "#c1c1c1")
      .attr("transform", `translate(${x + 24}, ${y + 42})`);
  }

}

export default Calendar
