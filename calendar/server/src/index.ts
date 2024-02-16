import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import {getMoonIllumination} from "suncalc";
import * as d3 from 'd3';
import { geoOrthographic } from 'd3-geo';
import { JSDOM } from 'jsdom';
import * as emoji from 'node-emoji'
import { Notomoji } from 'svgmoji';
import * as fluent from 'fluentui-emoji-js';

import data from '../node_modules/svgmoji/emoji.json';
const notomoji = new Notomoji({ data, type: 'all' });

dotenv.config();

const app: Express = express();
const port: string | number = process.env.PORT ?? 3000;

const getDayName = (date: Date): string => {
  const days: string[] = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
  return days[date.getDay()];
};

const getMonthName = (monthNumber: number): string => {
  const months: string[] = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return months[monthNumber];
};

app.get("/", (req: Request, res: Response): void => {
  res.send("Express + TypeScript Server");
});

app.get("/calendar", async (req: Request, res: Response): Promise<void> => {
  const DEFAULT_CELL_BG: string = 'rgba(255, 255, 255, 0)';
  const WEEKEND_CELL_BG: string = 'rgba(0, 0, 0, 0.1)';
  const BORDER_COLOR: string = 'rgba(0, 0, 0, .5)';

  const optHighlightWeekends: boolean = true;
  const optShowDayNames: boolean   = true;
  const optShowWeekendDayNames:boolean = true;
  const optRainbowDays1: boolean = false;
  const optRainbowDays2: boolean = false;
  const optRainbowDays3: boolean = false;
  const optRainbowWeekends: boolean = false;
  const optVermontWeekends: boolean = true;
  const optShowMoonPhases : boolean= true;
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

        if (optShowMoonPhases) {
          const date = new Date(year, month, day);
          const d3Date = d3.timeYear(date);
          const noon = d3.timeHour.offset(d3Date, 12);
          const moonIllumination = getMoonIllumination(date);
          const moonAngle = 180 - moonIllumination.phase * 360;

          svg.append("path")
              .attr("fill", "#000000")
              .attr("d", `${geoProjection.rotate([moonAngle, 0]), geoPath(geoHemisphere)}`)
              .attr("transform", `translate(${x + 35}, ${y + 12}) scale(0.75)`);
        }

        if (optFriday13th) {
          if (date.getDay() === 5 && date.getDate() === 13) {
            svg.append("text")
                .text('👻')
                .attr("x", x + 26)
                .attr("y", y + 64)
                .attr("font-size", "20px")
                .attr("font-family", "Helvetica")
                .attr("font-weight", "bold");
          }
        }

        if (optPersonalHolidays) {
          const personalHolidays = [
            {
              name: 'Sarah\'s Birthday',
              date: new Date(year, 3, 18),
              emoji: '🎂'
            },
            {
              name: 'Terrence\'s Birthday',
              date: new Date(year, 5, 2),
              emoji: '🎂'
            },
            {
              name: 'Our Anniversary',
              date: new Date(year, 9, 22),
              emoji: '💍'
            }
          ];

          const holiday = personalHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            const emojiName = emoji.which(holiday.emoji);
            const notOmojiUrl = notomoji.url(holiday.emoji);
            console.log(`name: ${emojiName}, url: ${notOmojiUrl}`);

            const fluentFile = await fluent.fromGlyph(holiday.emoji, 'High Contrast');
            const fluentUrl = `https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets${fluentFile}`
            console.log(`name: ${emojiName}, fluentUrl: ${fluentUrl}`);

            svg.append("image")
                .attr("xlink:href", fluentUrl)
                .attr("x", x + 26)
                .attr("y", y + cellHeight - 24)
                .attr("width", 20)
                .attr("height", 20);

            // svg.append("text")
            //     .text(holiday.emoji)
            //     .attr("x", x + 26)
            //     .attr("y", y + 64)
            //     .attr("font-size", "20px")
            //     .attr("font-family", "Helvetica")
            //     .attr("font-weight", "bold");
          }
        }

        if (optUSFederalHolidays) {
          const federalHolidays = [
            {
              name: 'New Year\'s Day',
              date: new Date(year, 0, 1),
              emoji: '🎉'
            },
            {
              name: 'Martin Luther King Jr. Day',
              date: new Date(year, 0, 20),
              emoji: '👑'
            },
            {
              name: 'Presidents Day',
              date: new Date(year, 1, 17),
              emoji: '🇺🇸'
            },
            {
              name: 'Memorial Day',
              date: new Date(year, 4, 25),
              emoji: '🌹'
            },
            {
              name: 'Independence Day',
              date: new Date(year, 6, 4),
              emoji: '🇺🇸'
            },
            {
              name: 'Veterans Day',
              date: new Date(year, 10, 11),
              emoji: '🇺🇸'
            },
            {
              name: 'Thanksgiving Day',
              date: new Date(year, 10, 28),
              emoji: '🦃'
            },
            {
              name: 'Christmas Day',
              date: new Date(year, 11, 25),
              emoji: '🎄'
            }
          ];

          const holiday = federalHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            // draw.text(function (add) {
            //   add.tspan(holiday.emoji).newLine();
            // }).move(x + 26, y + 50).font({
            //   size: 20,
            //   family: 'Helvetica',
            //   weight: 'bold'
            // });
          }
        }

        if (optCanadianHolidays) {
          const canadianHolidays = [
            {
              name: 'Canada Day',
              date: new Date(year, 6, 1),
              emoji: '🇨🇦'
            },
            {
              name: 'Victoria Day',
              date: new Date(year, 4, 18),
              emoji: '🇨🇦'
            },
            {
              name: 'Canada Day',
              date: new Date(year, 6, 1),
              emoji: '🇨🇦'
            },
            {
              name: 'Remembrance Day',
              date: new Date(year, 10, 11),
              emoji: '🇨🇦'
            },
            {
              name: 'Thanksgiving Day',
              date: new Date(year, 9, 14),
              emoji: '🇨🇦🦃'
            },
            {
              name: 'Boxing Day',
              date: new Date(year, 11, 26),
              emoji: '🎁'
            }
          ];

          const holiday = canadianHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            // draw.text(function (add) {
            //   add.tspan(holiday.emoji).newLine();
            // }).move(x + 26, y + 50).font({
            //   size: 20,
            //   family: 'Helvetica',
            //   weight: 'bold'
            // });
          }
        }

        if (optOtherHolidays) {
          const otherHolidays = [
            {
              name: 'Valentines Day',
              date: new Date(year, 1, 14),
              emoji: '💘'
            },
            {
              name: 'St. Patrick\'s Day',
              date: new Date(year, 2, 17),
              emoji: '🍀'
            },
            {
              name: 'Earth Day',
              date: new Date(year, 3, 22),
              emoji: '🌍'
            },
            {
              name: 'April Fools Day',
              date: new Date(year, 3, 1),
              emoji: '🤡'
            },
            {
              name: 'May Day',
              date: new Date(year, 4, 1),
              emoji: '🌷'
            },
            {
              name: 'Cinco de Mayo',
              date: new Date(year, 4, 5),
              emoji: '🇲🇽'
            },
            {
              name: 'Labor Day',
              date: new Date(year, 8, 2),
              emoji: '👷'
            },
            {
              name: 'Halloween',
              date: new Date(year, 9, 31),
              emoji: '🎃'
            },
            {
              name: 'Election Day',
              date: new Date(year, 10, 3),
              emoji: '🗳️'
            },
            {
              name: 'Black Friday',
              date: new Date(year, 10, 29),
              emoji: '🛍️'
            },
            {
              name: 'Cyber Monday',
              date: new Date(year, 11, 2),
              emoji: '💻'
            },
            {
              name: 'New Year\'s Eve',
              date: new Date(year, 11, 31),
              emoji: '🎆'
            }
          ];

          const holiday = otherHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            // draw.text(function (add) {
            //   add.tspan(holiday.emoji).newLine();
            // }).move(x + 26, y + 50).font({
            //   size: 20,
            //   family: 'Helvetica',
            //   weight: 'bold'
            // });
          }
        }

        if (optCatholicHolidays) {
          const catholicHolidays = [
            {
              name: 'Ash Wednesday',
              date: new Date(year, 1, 26),
              emoji: '⛪'
            },
            {
              name: 'Palm Sunday',
              date: new Date(year, 3, 5),
              emoji: '🌿'
            },
            {
              name: 'Good Friday',
              date: new Date(year, 3, 10),
              emoji: '✝️'
            },
            {
              name: 'Easter Sunday',
              date: new Date(year, 3, 12),
              emoji: '🐰'
            },
            {
              name: 'All Saints Day',
              date: new Date(year, 10, 1),
              emoji: '👼'
            },
            {
              name: 'Christmas Eve',
              date: new Date(year, 11, 24),
              emoji: '🎄'
            }
          ];

          const holiday = catholicHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            // draw.text(function (add) {
            //   add.tspan(holiday.emoji).newLine();
            // }).move(x + 26, y + 50).font({
            //   size: 20,
            //   family: 'Helvetica',
            //   weight: 'bold'
            // });
          }
        }

        if (optJewishHolidays) {
          const jewishHolidays = [
            {
              name: 'Passover',
              date: new Date(year, 3, 8),
              emoji: '🍷'
            },
            {
              name: 'Purim',
              date: new Date(year, 2, 10),
              emoji: '🎭'
            },
            {
              name: 'Rosh Hashanah',
              date: new Date(year, 8, 30),
              emoji: '🍎'
            },
            {
              name: 'Yom Kippur',
              date: new Date(year, 9, 9),
              emoji: '🕍'
            },
            {
              name: 'Hanukkah',
              date: new Date(year, 11, 22),
              emoji: '🕎'
            },
          ];

          const holiday = jewishHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            // draw.text(function (add) {
            //   add.tspan(holiday.emoji).newLine();
            // }).move(x + 26, y + 50).font({
            //   size: 20,
            //   family: 'Helvetica',
            //   weight: 'bold'
            // });
          }
        }

        if (optHinduHolidays) {
          const hinduHolidays = [
            {
              name: 'Republic Day',
              date: new Date(year, 0, 26),
              emoji: '🇮🇳'
            },
            {
              name: 'Independence Day',
              date: new Date(year, 7, 15),
              emoji: '🇮🇳'
            },
            {
              name: 'Diwali',
              date: new Date(year, 10, 14),
              emoji: '🪔'
            },
            {
              name: 'Holi',
              date: new Date(year, 2, 9),
              emoji: '🎨'
            },
            {
              name: 'Raksha Bandhan',
              date: new Date(year, 7, 3),
              emoji: '👫'
            },
            {
              name: 'Ganesh Chaturthi',
              date: new Date(year, 8, 2),
              emoji: '🐘'
            },
            {
              name: 'Navaratri',
              date: new Date(year, 9, 29),
              emoji: '🎉'
            },
            {
              name: 'Makar Sankranti',
              date: new Date(year, 0, 14),
              emoji: '🪁'
            }
          ];

          const holiday = hinduHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            // draw.text(function (add) {
            //   add.tspan(holiday.emoji).newLine();
            // }).move(x + 26, y + 50).font({
            //   size: 20,
            //   family: 'Helvetica',
            //   weight: 'bold'
            // });
          }
        }

        if (optIslamicHolidays) {
          const islamicHolidays = [
            {
              name: 'Eid al-Fitr',
              date: new Date(year, 4, 24),
              emoji: '🌙'
            },
            {
              name: 'Eid al-Adha',
              date: new Date(year, 7, 31),
              emoji: '🐑'
            },
            {
              name: 'Mawlid al-Nabi',
              date: new Date(year, 2, 8),
              emoji: '🕌'
            }
          ];

          const holiday = islamicHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            // draw.text(function (add) {
            //   add.tspan(holiday.emoji).newLine();
            // }).move(x + 26, y + 50).font({
            //   size: 20,
            //   family: 'Helvetica',
            //   weight: 'bold'
            // });
          }
        }

        if (optChineseHolidays) {
          const chineseHolidays = [
            {
              name: 'Chinese New Year',
              date: new Date(year, 0, 25),
              emoji: '🧧'
            },
            {
              name: 'Mid-Autumn Festival',
              date: new Date(year, 8, 13),
              emoji: '🥮'
            },
            {
              name: 'Dragon Boat Festival',
              date: new Date(year, 5, 7),
              emoji: '🐉'
            }
          ];

          const holiday = chineseHolidays.find(holiday => holiday.date.getTime() === date.getTime());
          if (holiday) {
            // draw.text(function (add) {
            //   add.tspan(holiday.emoji).newLine();
            // }).move(x + 26, y + 50).font({
            //   size: 20,
            //   family: 'Helvetica',
            //   weight: 'bold'
            // });
          }
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