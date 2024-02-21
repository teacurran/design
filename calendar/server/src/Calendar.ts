import {JSDOM} from "jsdom";
import * as d3 from "d3";

class Calendar {
  dom: JSDOM;
  documentBody: d3.Selection<HTMLElement, unknown, null, undefined>;

  cellPadding: number = 5;
  cellWidth: number = 50;
  cellHeight: number = 75;
  gridWidth: number = 32 * this.cellWidth;
  gridHeight: number = 12 * this.cellHeight;

  constructor() {
    this.dom = new JSDOM('<!DOCTYPE html><body></body>');
    this.documentBody = d3.select(this.dom.window.document.body);
  }

  getDayName = (date: Date): string => {
    const days: string[] = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
    return days[date.getDay()];
  };

  getMonthName = (monthNumber: number): string => {
    const months: string[] = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[monthNumber];
  };

  getSvg = (): d3.Selection<SVGSVGElement, unknown, null, undefined> => {
    const width = this.gridWidth;
    const height = this.gridHeight + 100;

    const svg = this.documentBody.append("svg")
      .attr("width", width)
      .attr("height", height);

    svg.append("text")
      .text("2024")
      .attr("x", 50)
      .attr("y", 80)
      .attr("fill", "#a1a1a1")
      .attr("font-size", "80px")
      .attr("font-family", "Helvetica")
      .attr("font-weight", "bold");

    return svg;
  }

  getSvgAsDocument = (): JSDOM => {
    return this.dom;
  }


}
