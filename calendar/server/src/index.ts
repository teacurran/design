import express, {Express, Request, Response} from "express";
import dotenv from "dotenv";
import * as suncalc from "suncalc";
import * as d3 from 'd3';
import {geoOrthographic} from 'd3-geo';
import {JSDOM} from 'jsdom';
import * as emoji from 'node-emoji'
import {Notomoji} from 'svgmoji';
import * as fluent from 'fluentui-emoji-js';
import {parse} from 'csv-parse/sync';
import * as fs from "fs";
import * as path from "path";

import data from '../node_modules/svgmoji/emoji.json';
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
} from "./holidays";
import DateTempColor from "./DateTempColor";

const notomoji = new Notomoji({data, type: 'all'});

dotenv.config();

const app: Express = express();
const port: string | number = process.env.PORT ?? 3000;

const DEFAULT_CELL_BG: string = 'rgba(255, 255, 255, 0)';
const WEEKEND_CELL_BG: string = 'rgba(0, 0, 0, 0.1)';
const BORDER_COLOR: string = 'rgba(0, 0, 0, .5)';

const optHighlightWeekends: boolean = true;
const optShowDayNames: boolean = true;
const optShowWeekendDayNames: boolean = true;
const optRainbowDays1: boolean = false;
const optRainbowDays2: boolean = false;
const optRainbowDays3: boolean = false;
const optRainbowWeekends: boolean = true;
const optVermontWeekends: boolean = false;

const optShowMoonIllumination: boolean = false;
const optShowMoonPhase: boolean = true;

const optFriday13th: boolean = true;
const optPersonalHolidays: boolean = true;
const optUSFederalHolidays: boolean = false;
const optCanadianHolidays: boolean = false
const optOtherHolidays: boolean = false
const optJewishHolidays: boolean = false
const optIslamicHolidays: boolean = false;
const optCatholicHolidays: boolean = false;
const optHinduHolidays: boolean = false;
const optChineseHolidays: boolean = false;

const cellPadding: number = 5;
const cellWidth: number = 50;
const cellHeight: number = 75;
const gridWidth: number = 32 * cellWidth;
const gridHeight: number = 12 * cellHeight;
const startDate: Date = new Date(2024, 0, 1);

const getDayName = (date: Date): string => {
  const days: string[] = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
  return days[date.getDay()];
};

const getMonthName = (monthNumber: number): string => {
  const months: string[] = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return months[monthNumber];
};

function lerp(value: number, oldRange: [number, number], newRange: [number, number]): number {
  return (value - oldRange[0]) * (newRange[1] - newRange[0]) / (oldRange[1] - oldRange[0]) + newRange[0];
}
function temperatureToColor(temp: number): string {
  const blue = [0, 0, 255];
  const red = [255, 0, 0];
  const rgb = [
    Math.round(lerp(temp, [-10, 110], [blue[0], red[0]])),
    Math.round(lerp(temp, [-10, 110], [blue[1], red[1]])),
    Math.round(lerp(temp, [-10, 110], [blue[2], red[2]]))
  ];
  const hex = rgb.map(value => value.toString(16).padStart(2, '0')).join('');
  return `#${hex}`;
}

const appendEmoji = async (svg: any, value: string, x: number, y: number): Promise<void> => {
  const emojiName = emoji.which(value);
  const notOmojiUrl = notomoji.url(value);
  console.log(`name: ${emojiName}, url: ${notOmojiUrl}`);

  const fluentFile = await fluent.fromGlyph(value, 'High Contrast');
  const fluentUrl = `https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets${fluentFile}`
  console.log(`name: ${emojiName}, fluentUrl: ${fluentUrl}`);

  svg.append("image")
    .attr("xlink:href", fluentUrl)
    .attr("x", x + 26)
    .attr("y", y + cellHeight - 24)
    .attr("width", 20)
    .attr("height", 20);
}

app.get("/", (req: Request, res: Response): void => {
  res.send("Express + TypeScript Server");
});

app.get("/calendar", async (req: Request, res: Response): Promise<void> => {

  const geoProjection = geoOrthographic()
    .translate([0, 0])
    .scale(10);

  const geoPath = d3.geoPath(geoProjection);
  const geoHemisphere = d3.geoCircle()();

  const vermontMonthlyColors = [
    ['#FFFFFF', '#E8F1F2', '#BBD5DA', '#95A5A6',
      '#727272', '#5E6A71', '#3B444B', '#2C3E50',
      '#DADFE1', '#ABB7B7'], // Snowy and frosty hues
    ['#FFFFFF', '#ECECEC', '#D6E6E4', '#C0C5C1',
      '#9FA9A3', '#7E8C8D', '#616A6B', '#505B62',
      '#394A51', '#22313F'], // Late winter, hinting at spring
    ['#E9F7EF', '#D4EFDF', '#A9DFBF', '#7DCEA0',
      '#52BE80', '#3498DB', '#85C1E9', '#AED6F1',
      '#D6DBDF', '#85929E'], // Early spring, snow melting, fresh greens
    ['#EAF2F8', '#D4E6F1', '#AED6F1', '#85C1E9',
      '#5499C7', '#48C9B0', '#76D7C4', '#A2D9CE',
      '#EBF5FB', '#B3B6B7'], // Spring, clear skies, blooming flowers
    ['#E8F6F3', '#D0ECE7', '#A2D9CE', '#73C6B6',
      '#45B39D', '#58D68D', '#82E0AA', '#ABEBC6',
      '#D5F5E3', '#FEF9E7'], // Late spring, lush landscapes
    ['#FDEDEC', '#FADBD8', '#F5B7B1', '#F1948A',
      '#EC7063', '#E74C3C', '#CD6155', '#A93226',
      '#922B21', '#7B241C'], // Early summer, warm tones, sunsets
    ['#F9EBEA', '#F2D7D5', '#E6B0AA', '#D98880',
      '#CD6155', '#C0392B', '#A93226', '#922B21',
      '#7B241C', '#641E16'], // Peak summer, warmth, longer days
    ['#F5CBA7', '#F0B27A', '#EB984E', '#E67E22',
      '#CA6F1E', '#AF601A', '#935116', '#784212',
      '#6E2C00', '#566573'], // Late summer, transition to fall
    ['#FAD7A0', '#F8C471', '#F5B041', '#F39C12',
      '#D68910', '#B9770E', '#9C640C', '#7E5109',
      '#6E2C00', '#1A5276'], // Early fall, leaves changing
    ['#FDEBD0', '#FAD7A0', '#F8C471', '#F5B041',
      '#F39C12', '#D68910', '#B9770E', '#9C640C',
      '#7E5109', '#6E2C00'], // Peak fall, vibrant foliage
    ['#F4F6F7', '#E5E8E8', '#CCD1D1', '#B2BABB',
      '#99A3A4', '#7F8C8D', '#626567', '#515A5A',
      '#424949', '#333F42'], // Late fall, transition to winter
    ['#FBFCFC', '#ECF0F1', '#D0D3D4', '#B3B6B7',
      '#979A9A', '#808B96', '#566573', '#2C3E50',
      '#212F3C', '#1C2833']  // Early winter, holiday season, snowy landscapes
  ];


  const width = gridWidth;
  const height = gridHeight + 100;

  const dom = new JSDOM('<!DOCTYPE html><body></body>');
  const documentBody = d3.select(dom.window.document.body);

  const svg = documentBody.append("svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("text")
    .text("2024")
    .attr("x", 1400)
    .attr("y", 80)
    .attr("font-size", "80px")
    .attr("font-family", "Helvetica")
    .attr("font-weight", "bold");

  const totalColumns = 32;
  const totalRows = 12;
  const maxDistance = Math.sqrt(Math.pow(totalRows - 1, 2) + Math.pow(totalColumns - 1, 2));

  for (let row = 0; row < totalRows; row++) {
    let weekendIndex = -1;
    for (let col = 0; col < totalColumns; col++) {
      const x = col * cellWidth;
      const y = row * cellHeight + 99;

      const date = new Date(new Date().getFullYear(), row, col);
      const day = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear();

      let cellBackgroundColor = DEFAULT_CELL_BG

      let isWeekend = false;
      if (date.getDay() == 0 || date.getDay() == 6) {
        isWeekend = true;
        weekendIndex++;
      }

      if (optHighlightWeekends && date.getMonth() === row) {
        if (date.getDay() == 0 || date.getDay() == 6) {
          cellBackgroundColor = WEEKEND_CELL_BG
        }
      }

      if (optRainbowDays1) {
        const hue = date.getDay() * 30;
        cellBackgroundColor = `hsl(${hue}, 100%, 90%)`;
      }

      if (optRainbowDays2) {
        const hue = (col / (30)) * 360;

        // Assuming saturation and lightness are constant to keep the example simple
        const saturation = 100; // 100% for vibrant colors
        const lightness = 50; // 50% is a balanced lightness for visibility

        // Construct the HSL color string
        cellBackgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      }

      if (optRainbowDays3) {
        // Calculate Euclidean distance from the bottom right corner
        const distance = Math.sqrt(Math.pow(totalRows - 1 - row, 2) + Math.pow(totalColumns - 1 - col, 2));

        // Normalize distance
        const normalizedDistance = distance / maxDistance;

        // Adjust hue based on distance (you can experiment with this part)
        const hue = normalizedDistance * 360;

        // Adjust lightness from 50% at the nearest point to 10% at the farthest to create a radial effect
        // You can adjust the range of lightness based on your desired effect
        //const lightness = 50 - (normalizedDistance * 40); // Ranges from 10% to 50%

        // Modify lightness adjustment to ensure colors remain light across the gradient
        // Consider keeping lightness above a minimum threshold that avoids the colors becoming too dark
        const lightnessMin = 80; // Minimum lightness value to avoid dark colors
        const lightnessMax = 95; // Maximum lightness value for vibrant colors
        const lightness = lightnessMin + (1 - normalizedDistance) * (lightnessMax - lightnessMin);


        // Saturation can remain constant or be adjusted similarly
        const saturation = 50; // Keeping saturation constant for vibrant colors

        cellBackgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      }

      if (optRainbowWeekends) {
        if (date.getDay() == 0 || date.getDay() == 6) {
          const hue = (col / (30)) * 360;
          cellBackgroundColor = `hsl(${hue}, 100%, 90%)`;
        }
      }

      if (optVermontWeekends) {
        if (isWeekend) {
          cellBackgroundColor = vermontMonthlyColors[row][weekendIndex];
        }
      }

      if (col === 0) {
        // draw.line(x, y + cellHeight, x + cellWidth, y + cellHeight).stroke(BORDER_COLOR);
        svg.append("text")
          .text(getMonthName(row))
          .attr("x", x)
          .attr("y", y + 60)
          .attr("font-size", "20px")
          .attr("font-family", "Helvetica")
          .attr("font-weight", "bold")
          .attr("transform", "rotate(-25," + x + "," + (y + 40) + ")");
      } else {
        svg.append("rect")
          .attr("width", cellWidth)
          .attr("height", cellHeight)
          .attr("x", x)
          .attr("y", y)
          .attr("fill", cellBackgroundColor)
          .attr("stroke", BORDER_COLOR);
      }

      // if the month different than row then it's the next month and should be blank
      if (date.getMonth() === row) {
        const dayName = getDayName(date);

        svg.append("text")
          .text(col)
          .attr("x", x + cellPadding)
          .attr("y", y + 14)
          .attr("font-size", "12px")
          .attr("font-family", "Helvetica")
          .attr("font-weight", "bold");

        let showDay = optShowDayNames;
        if (date.getDay() == 0 || date.getDay() == 6) {
          showDay = optShowWeekendDayNames;
        }

        if (showDay) {
          svg.append("text")
            .text(dayName)
            .attr("x", x + cellPadding)
            .attr("y", y + 64)
            .attr("font-size", "12px")
            .attr("font-family", "Helvetica")
            .attr("font-weight", "bold");
        }

        if (optShowMoonIllumination) {
          const date = new Date(year, month, day);
          const d3Date = d3.timeDay(date);
          const noon = d3.timeHour.offset(d3Date, 12);
          const moonIllumination = suncalc.getMoonIllumination(noon);
          const moonAngle = 180 - moonIllumination.phase * 360;

          svg.append("path")
            .attr("fill", "#000000")
            .attr("d", `${geoProjection.rotate([moonAngle, 0]), geoPath(geoHemisphere)}`)
            .attr("transform", `translate(${x + 35}, ${y + 12}) scale(0.75)`);
        }

        if (optShowMoonPhase) {
          const date = new Date(year, month, day);
          const d3Date = d3.timeDay(date);
          const moonIllumination = suncalc.getMoonIllumination(date);
          const moonPhase = Math.round(moonIllumination.phase * 1e3) / 1e3;

          console.log(`moonPhase: ${moonPhase}`);
          const moonY = y - 46;
          const moonX = x - 3;
          if (moonPhase <= 0.032) {
            await appendEmoji(svg, '🌑', moonX, moonY);
          } else if (moonPhase >= 0.230 && moonPhase <= 0.267) {
            await appendEmoji(svg, '🌓', moonX, moonY);
          } else if (moonPhase >= 0.475 && moonPhase <= 0.52) {
            await appendEmoji(svg, '🌕', moonX, moonY);
          } else if (moonPhase >= 0.73 && moonPhase <= 0.76) {
            await appendEmoji(svg, '🌗', moonX, moonY);
          }
        }

        if (optFriday13th) {
          if (date.getDay() === 5 && date.getDate() === 13) {
            await appendEmoji(svg, '👻', x, y);
          }
        }

        if (optPersonalHolidays) {
          const holiday = personalHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y);
          }
        }

        if (optUSFederalHolidays) {
          const holiday = federalHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y);
          }
        }

        if (optCanadianHolidays) {
          const holiday = canadianHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y);
          }
        }

        if (optOtherHolidays) {
          const holiday = otherHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y);
          }
        }

        if (optCatholicHolidays) {
          const holiday = catholicHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y);
          }
        }

        if (optJewishHolidays) {
          const holiday = jewishHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y);
          }
        }

        if (optHinduHolidays) {
          const holiday = hinduHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y);
          }
        }

        if (optIslamicHolidays) {
          const holiday = islamicHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y);
          }
        }

        if (optChineseHolidays) {
          const holiday = chineseHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            await appendEmoji(svg, holiday.emoji, x, y);
          }
        }
      }
    }
  }

  res.setHeader('Content-Type', 'image/svg+xml');

  svg.attr("xmlns", "http://www.w3.org/2000/svg");

  res.send(documentBody.html());

});

app.get("/moonmap", async (req: Request, res: Response): Promise<void> => {
  const dom = new JSDOM('<!DOCTYPE html><body></body>');
  const documentBody = d3.select(dom.window.document.body);

  const width = gridWidth;
  const height = gridHeight + 100;

  const svg = documentBody.append("svg")
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

  const totalColumns = 32;
  const totalRows = 12;
  const maxDistance = Math.sqrt(Math.pow(totalRows - 1, 2) + Math.pow(totalColumns - 1, 2));

  for (let row = 0; row < totalRows; row++) {
    let weekendIndex = -1;
    for (let col = 0; col < totalColumns; col++) {
      const x = col * cellWidth;
      const y = row * cellHeight + 99;

      const date = new Date(new Date().getFullYear(), row, col);
      const day = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear();

      let cellBackgroundColor = DEFAULT_CELL_BG

      let isWeekend = false;
      if (date.getDay() == 0 || date.getDay() == 6) {
        isWeekend = true;
        weekendIndex++;
      }

      if (optHighlightWeekends && date.getMonth() === row) {
        if (date.getDay() == 0 || date.getDay() == 6) {
          cellBackgroundColor = WEEKEND_CELL_BG
        }
      }

      if (optRainbowWeekends) {
        if (date.getDay() == 0 || date.getDay() == 6) {
          const hue = (col / (30)) * 360;
          cellBackgroundColor = `hsl(${hue}, 100%, 90%)`;
        }
      }

      if (col === 0) {
        // draw.line(x, y + cellHeight, x + cellWidth, y + cellHeight).stroke(BORDER_COLOR);
        svg.append("text")
          .text(getMonthName(row))
          .attr("x", x)
          .attr("y", y + 50)
          .attr("fill", "#a1a1a1")
          .attr("font-size", "20px")
          .attr("font-family", "Helvetica")
          .attr("font-weight", "bold");
      }

      if (date.getMonth() === row) {
        if (col > 0) {
          svg.append("rect")
            .attr("width", cellWidth)
            .attr("height", cellHeight)
            .attr("x", x)
            .attr("y", y)
            .attr("fill", cellBackgroundColor);
        }

        const dayName = getDayName(date);

        svg.append("text")
          .text(col)
          .attr("x", x + 5)
          .attr("y", y + 14)
          .attr("font-size", "12px")
          .attr("font-family", "Helvetica");

        const geoProjection = geoOrthographic()
          .translate([0, 0])
          .scale(20);

        const geoPath = d3.geoPath(geoProjection);
        const geoHemisphere = d3.geoCircle()();

        const moonIllumination = suncalc.getMoonIllumination(date);
        const moonAngle = 180 - moonIllumination.phase * 360;

        svg.append("circle")
          .attr("r", 20)
          .attr("fill", "#c1c1c1")
          .attr("transform", `translate(${x + 24}, ${y + 42})`);

        svg.append("path")
          .attr("fill", "#FFFFFF")
          .attr("d", `${geoProjection.rotate([moonAngle, 0]), geoPath(geoHemisphere)}`)
          .attr("transform", `translate(${x + 24}, ${y + 42})`);

        svg.append("circle")
          .attr("r", 20)
          .attr("fill", "none")
          .attr("stroke", "#000000")
          .attr("transform", `translate(${x + 24}, ${y + 42})`);

      }
    }
  }

  res.setHeader('Content-Type', 'image/svg+xml');
  svg.attr("xmlns", "http://www.w3.org/2000/svg");
  res.send(documentBody.html());
});

app.get("/daylight", async (req: Request, res: Response): Promise<void> => {
  const dom = new JSDOM('<!DOCTYPE html><body></body>');
  const documentBody = d3.select(dom.window.document.body);

  const width = gridWidth;
  const height = gridHeight + 100;

  const csvFilePath = path.resolve(__dirname, 'data', 'full_year_temperature_colors.csv');
  const headers = ['date', 'temp', 'color'];
  const fileContent = fs.readFileSync(csvFilePath, {encoding: 'utf-8'});

  let dayColors: DateTempColor[] = parse(fileContent, {
    delimiter: ',',
    columns: headers,
    cast: function (value, context) {
      if (context.column === 'date') {
        return new Date(value);
      } else if (context.column === 'temp') {
        return parseInt(value);
      } else {
        return value;
      }
    }
  });
  console.log("dayColors", dayColors);

  const svg = documentBody.append("svg")
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


  const totalColumns = 32;
  const totalRows = 12;
  const maxDistance = Math.sqrt(Math.pow(totalRows - 1, 2) + Math.pow(totalColumns - 1, 2));

  for (let row = 0; row < totalRows; row++) {
    let weekendIndex = -1;
    let moonPhases: string[] = [];
    for (let col = 0; col < totalColumns; col++) {
      const x = col * cellWidth;
      const y = row * cellHeight + 99;

      const date = new Date(new Date().getFullYear(), row, col);
      const day = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear();

      let cellBackgroundColor = DEFAULT_CELL_BG

      let isWeekend = false;
      if (date.getDay() == 0 || date.getDay() == 6) {
        isWeekend = true;
        weekendIndex++;
      }

      if (optHighlightWeekends && date.getMonth() === row) {
        if (date.getDay() == 0 || date.getDay() == 6) {
          cellBackgroundColor = WEEKEND_CELL_BG
        }
      }

      if (optRainbowWeekends) {
        if (date.getDay() == 0 || date.getDay() == 6) {
          const hue = (col / (30)) * 360;
          cellBackgroundColor = `hsl(${hue}, 100%, 95%)`;
        }
      }


      // loop over dayColors and if one matches today's date, set the cellBackgroundColor to the color
      // if (dayColors) {
      //   const dayColor = dayColors.find(dayColor => {
      //     if (dayColor.date) {
      //       return dayColor.date.getMonth() === date.getMonth() && dayColor.date.getDay() === date.getDay();
      //     }
      //     return false;
      //   });
      //   if (dayColor) {
      //     cellBackgroundColor = temperatureToColor(dayColor.temp)
      //   }
      // }

      if (col === 0) {
        // draw.line(x, y + cellHeight, x + cellWidth, y + cellHeight).stroke(BORDER_COLOR);
        svg.append("text")
          .text(getMonthName(row))
          .attr("x", x)
          .attr("y", y + 50)
          .attr("fill", "#a1a1a1")
          .attr("font-size", "20px")
          .attr("font-family", "Helvetica")
          .attr("font-weight", "bold");
      }

      if (date.getMonth() === row) {
        if (col > 0) {
          svg.append("rect")
            .attr("width", cellWidth)
            .attr("height", cellHeight)
            .attr("x", x)
            .attr("y", y)
            .attr("fill", cellBackgroundColor);
        }

        const dayName = getDayName(date);

        svg.append("text")
          .text(col)
          .attr("x", x + 5)
          .attr("y", y + 14)
          .attr("font-size", "12px")
          .attr("font-family", "Helvetica");

        const sunTimes = suncalc.getTimes(date, 40.7128, -74.0060);

        const sunrise = sunTimes.sunrise;
        const sunset = sunTimes.sunset;

        var preSunriseDuration = sunrise.getHours() + sunrise.getMinutes() / 60;
        var daylightDuration = (sunset.getHours() + sunset.getMinutes() / 60) - preSunriseDuration;
        var postSunsetDuration = 24 - (sunset.getHours() + sunset.getMinutes() / 60);

        var yScale = d3.scaleLinear()
          .domain([0, 24])
          .range([0, cellHeight]);

        // svg.append('rect')
        //   .attr('x', x)
        //   .attr('y', y)
        //   .attr('width', cellWidth)
        //   .attr('height', yScale(preSunriseDuration))
        //   .attr('fill', '#c1c1c1');

        svg.append('rect')
          .attr('x', x)
          .attr('y', y + yScale(preSunriseDuration))
          .attr('width', cellWidth - 3)
          .attr('height', yScale(daylightDuration))
          .attr('fill', 'none')
          .attr('stroke', '#dddddd')

// Post-sunset
//         svg.append('rect')
//           .attr('x', x)
//           .attr('y', y + yScale(preSunriseDuration + daylightDuration))
//           .attr('width', cellWidth)
//           .attr('height', yScale(postSunsetDuration))
//           .attr('fill', '#c1c1c1'); // Darker blue for post-sunset


        const moonSize = 7;

        const geoProjection = geoOrthographic()
          .translate([0, 0])
          .scale(moonSize);

        const geoPath = d3.geoPath(geoProjection);
        const geoHemisphere = d3.geoCircle()();

        const moonIllumination = suncalc.getMoonIllumination(date);
        const moonAngle = 180 - moonIllumination.phase * 360;

        const moonPhase = Math.round(moonIllumination.phase * 1e3) / 1e3;
        let moonPhaseName: string | undefined;

        const moonY = y - 46;
        const moonX = x - 3;
        if (moonPhase <= 0.032) {
          moonPhaseName = 'new moon';
        } else if (moonPhase >= 0.22 && moonPhase <= 0.3) {
          moonPhaseName = 'first quarter';
        } else if (moonPhase >= 0.475 && moonPhase <= 0.52) {
          moonPhaseName = 'full moon';
        } else if (moonPhase >= 0.73 && moonPhase <= 0.76) {
          moonPhaseName = 'last quarter';
        }

        let showMoon: boolean = false;
        if (moonPhaseName) {
          if (!moonPhases.includes(moonPhaseName)) {
            moonPhases.push(moonPhaseName);
            showMoon = true;
          }
        }
        if (showMoon) {
          const moonX = x + 35;
          const moonY = y + 9;
          svg.append("circle")
            .attr("r", moonSize)
            .attr("fill", "#c1c1c1")
            .attr("transform", `translate(${moonX}, ${moonY})`);

          svg.append("path")
            .attr("fill", "#FFFFFF")
            .attr("d", `${geoProjection.rotate([moonAngle, 0]), geoPath(geoHemisphere)}`)
            .attr("transform", `translate(${moonX}, ${moonY})`);

          svg.append("circle")
            .attr("r", moonSize)
            .attr("fill", "none")
            .attr("stroke", "#000000")
            .attr("transform", `translate(${moonX}, ${moonY})`);
        }
      }
    }
  }

  res.setHeader('Content-Type', 'image/svg+xml');
  svg.attr("xmlns", "http://www.w3.org/2000/svg");
  res.send(documentBody.html());
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
