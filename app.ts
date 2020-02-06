import blessed from "blessed";
import contrib from "blessed-contrib";
import chalk from "chalk";
import { DateTime } from "luxon";
import { map } from "rxjs/operators";
import {
  getLineChartData,
  getNews,
  getRumors,
  getArea,
  getMarkers
} from "./data";

const screen = blessed.screen({
  fullUnicode: true
});
const grid = new contrib.grid({ rows: 6, cols: 12, screen });
screen.key(["escape", "q", "C-c"], function(ch, key) {
  return process.exit(0);
});

const clock = grid.set(0, 0, 1, 6, contrib.lcd, {
  elements: 8,
  display: "00 00 00" as any,
  label: "Local Time" as any
} as contrib.Widgets.LcdOptions);

const worldMap = grid.set(1, 0, 3, 6, contrib.map, {
  label: "World Map"
} as contrib.Widgets.MapOptions) as contrib.Widgets.MapElement;

const line1 = grid.set(0, 6, 3, 3, contrib.line, {
  style: { line: "yellow", text: "green", baseline: "white" },
  xLabelPadding: 3,
  xPadding: 5,
  showLegend: true,
  label: "Dead/Cured"
} as contrib.Widgets.LineOptions);

const line2 = grid.set(0, 9, 3, 3, contrib.line, {
  style: { line: "yellow", text: "green", baseline: "white" },
  xLabelPadding: 3,
  xPadding: 5,
  showLegend: true,
  label: "Confirmed/Suspected"
} as contrib.Widgets.LineOptions);

const gauge1 = grid.set(3, 6, 1, 6, contrib.gauge, {
  label: "Stacked",
  showLabel: true
} as contrib.Widgets.GaugeOptions);

gauge1.setStack([
  { percent: 3, stroke: "green" },
  { percent: 57, stroke: "magenta" },
  { percent: 40, stroke: "cyan" }
]);

const newsLogger = grid.set(4, 0, 2, 4, contrib.log, {
  label: "News"
} as contrib.Widgets.LogOptions);

const rumorLogger = grid.set(4, 4, 2, 4, contrib.log, {
  label: "Rumors"
} as contrib.Widgets.LogOptions);

const table = grid.set(4, 8, 2, 4, contrib.table, {
  keys: true,
  fg: "white",
  selectedFg: "white",
  selectedBg: "blue",
  interactive: true as any,
  label: "Each Area",
  width: "30%",
  height: "30%",
  border: { type: "line", fg: "cyan" },
  columnSpacing: 6, //in chars
  columnWidth: [12, 10, 5, 5] /*in chars*/
} as contrib.Widgets.TableOptions);

table.focus();

getArea().then(data => {
  table.setData({
    headers: ["Province", "Confirmed", "Cured", "Dead"],
    data: data as any
  });
});

getNews(1800).then(data => {
  data
    .pipe(
      map(news => {
        const time = chalk.yellow(
          DateTime.fromMillis(news.pubDate).toFormat("MM-dd HH:mm:ss")
        );
        const publisher = chalk.green(news.infoSource);
        const title = news.title;
        return `[${time}][${publisher}]${title}`;
      })
    )
    .subscribe(news => {
      newsLogger.log(news);
    });
});

getRumors(3100).then(data => {
  data
    .pipe(
      map(rumor => {
        const q = `┏ ${chalk.yellow(rumor.title)}`;
        const a = `┗ ${chalk.green(rumor.mainSummary)}`;
        return { q, a };
      })
    )
    .subscribe(rumor => {
      rumorLogger.log(rumor.q);
      rumorLogger.log(rumor.a);
    });
});

getLineChartData().then(data => {
  let dead = {
    ...{ title: "Dead", style: { line: "red" } },
    ...data.dead
  };
  let cured = {
    ...{ title: "Cured" },
    ...data.cured
  };
  let serious = {
    ...{ title: "Serious", style: { line: "blue" } },
    ...data.serious
  };
  let confirmed = {
    ...{ title: "Confirmed", style: { line: "red" } },
    ...data.confirmed
  };
  let suspected = {
    ...{ title: "Suspected" },
    ...data.suspected
  };
  line1.setData([dead, cured]);
  line2.setData([serious, confirmed, suspected]);
});

setInterval(() => {
  const time = DateTime.local().toLocaleString(DateTime.TIME_24_WITH_SECONDS);
  clock.setDisplay(time);
  screen.render();
}, 1000);

let marker = true;
setInterval(() => {
  const markers = getMarkers();
  if (marker) {
    markers.forEach(({ lon, lat }) =>
      (worldMap as any).addMarker({ lon, lat })
    );
  } else {
    (worldMap as any).clearMarkers();
  }
  marker = !marker;
}, 1500);

screen.render();
