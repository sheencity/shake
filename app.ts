import blessed from "blessed";
import contrib from "blessed-contrib";
import { DateTime } from "luxon";
const screen = blessed.screen();
const grid = new contrib.grid({ rows: 4, cols: 2, screen });

type Lcd = contrib.Widgets.LcdElement;
const clock: Lcd = grid.set(0, 0, 1, 1, contrib.lcd, {
  elements: 8,
  display: "00 00 00" as any,
  label: "Local Time"
});

type Map = contrib.Widgets.MapElement;
const map: any = grid.set(1, 0, 3, 1, contrib.map, { label: "World Map" });

type Line = contrib.Widgets.LineElement;
const line: Line = grid.set(0, 1, 4, 1, contrib.line, {
  style: { line: "yellow", text: "green", baseline: "white" },
  xLabelPadding: 3,
  xPadding: 5,
  showLegend: true,
  label: "Title"
});

const series1 = {
  title: "Dead",
  style: {
    line: "red"
  },
  x: [
    "1-23",
    "1-24",
    "1-25",
    "1-26",
    "1-27",
    "1-28",
    "1-29",
    "1-30",
    "1-31",
    "2-1",
    "2-2",
    "2-3",
    "2-4"
  ],
  y: [25, 41, 56, 80, 106, 132, 170, 213, 259, 304, 361, 425, 493]
};
const series2 = {
  title: "Cured",
  x: [
    "1-23",
    "1-24",
    "1-25",
    "1-26",
    "1-27",
    "1-28",
    "1-29",
    "1-30",
    "1-31",
    "2-1",
    "2-2",
    "2-3",
    "2-4"
  ],
  y: [34, 38, 49, 51, 60, 103, 124, 171, 243, 328, 475, 632, 1010]
};

line.setData([series1, series2]);
map.addMarker({ lon: "116.46", lat: "39.92" });
// map.addMarker({ lon: "113.23", lat: "23.16" });

screen.key(["escape", "q", "C-c"], function(ch, key) {
  return process.exit(0);
});

setInterval(() => {
  const time = DateTime.local().toLocaleString(
    DateTime.TIME_24_WITH_SECONDS
  );
  clock.setDisplay(time);
  screen.render();
}, 1000);

screen.render();
