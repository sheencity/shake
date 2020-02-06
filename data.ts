import got from "got";
import _ from "lodash";
import { DateTime } from "luxon";
import { from, combineLatest, interval, zip } from "rxjs";
import { map, distinctUntilChanged } from "rxjs/operators";
import chalk from "chalk";
const OverallKeys: [
  "deadCount",
  "curedCount",
  "confirmedCount",
  "suspectedCount",
  "seriousCount",
  "updateTime"
] = [
  "deadCount",
  "curedCount",
  "confirmedCount",
  "suspectedCount",
  "seriousCount",
  "updateTime"
];

type Wrapper<T> = {
  success: boolean;
  results: T[];
};

type Overall = Wrapper<{
  deadCount: number;
  curedCount: number;
  confirmedCount: number;
  suspectedCount: number;
  seriousCount?: number;
  updateTime: number;
}>;

type New = Wrapper<{
  title: string;
  summary: string;
  pubDate: number;
  infoSource: string;
}>;

type Rumor = Wrapper<{
  title: string;
  mainSummary: string;
}>;

const endpoint = "https://lab.isaaclin.cn/nCoV/api";

async function overall() {
  const url = `${endpoint}/overall?latest=0`;
  const response = await got<Overall>(url, { responseType: "json" });

  return response.body.results.map(record => _.pick(record, OverallKeys));
}

type UnPromise<T extends Promise<any>> = T extends Promise<infer R> ? R : any;
type UnArray<T extends any[]> = T extends (infer R)[] ? R : any;
type A = UnArray<UnPromise<ReturnType<typeof overall>>>;

export async function getLineChartData() {
  const data = await overall();

  const groupByDateAndTakeMax: { [index: string]: A } = _.reduce(
    _.groupBy(
      data.map(record =>
        _.assign(record, {
          date: DateTime.fromMillis(record.updateTime).toFormat("M-d")
        })
      ),
      "date"
    ),
    (result: any, value, key) => {
      result[key] = _.pick(_.maxBy(value, "updateTime"), OverallKeys);
      return result;
    },
    {}
  );
  // groupByDateAndTakeMax
  type T = { x: string[]; y: number[] };
  return _.reduce(
    Object.entries(groupByDateAndTakeMax).sort((a, b) => {
      return a[1].updateTime - b[1].updateTime;
    }),
    (result, value) => {
      const [
        date,
        {
          deadCount: dead,
          curedCount: cured,
          confirmedCount: confirmed,
          suspectedCount: suspected,
          seriousCount: serious
        }
      ] = value;
      result.dead.x.push(date);
      result.dead.y.push(dead);
      result.cured.x.push(date);
      result.cured.y.push(cured);
      result.confirmed.x.push(date);
      result.confirmed.y.push(confirmed);
      result.suspected.x.push(date);
      result.suspected.y.push(suspected);
      result.serious.x.push(date);
      result.serious.y.push(serious ?? 0);
      return result;
    },
    {
      dead: { x: [], y: [] } as T,
      cured: { x: [], y: [] } as T,
      confirmed: { x: [], y: [] } as T,
      suspected: { x: [], y: [] } as T,
      serious: { x: [], y: [] } as T
    }
  );
}

export async function getNews(millis: number) {
  const url = `${endpoint}/news?num=all`;
  const response = await got<New>(url, { responseType: "json" });

  return zip(from(response.body.results), interval(millis), val => val);
}

export async function getRumors(millis: number) {
  const url = `${endpoint}/rumors?num=all`;
  const response = await got<Rumor>(url, { responseType: "json" });

  // from(response.body.results)

  return zip(from(response.body.results), interval(millis), val => val);
}

async function run() {
  const a = await getRumors(2100);
  a.pipe(
    map(rumor => {
      const q = `┏ ${chalk.yellow(rumor.title)}`;
      const a = `┗ ${chalk.green(rumor.mainSummary)}`;
      return { q, a };
    })
  ).subscribe(n => console.log(n));
  // console.log(a);
}

// run();
