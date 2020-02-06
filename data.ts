import got from "got";
import _ from "lodash";
import { DateTime } from "luxon";
import { from, interval, zip } from "rxjs";

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

type Area = Wrapper<{
  provinceShortName: string;
  confirmedCount: number;
  suspectedCount: number;
  curedCount: number;
  deadCount: number;
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

export async function getArea() {
  const url = `${endpoint}/area`;
  const response = await got<Area>(url, { responseType: "json" });

  return _.orderBy(
    response.body.results,
    ["confirmedCount"],
    ["desc"]
  ).map(data => [
    data.provinceShortName.padEnd(10),
    data.confirmedCount,
    data.curedCount,
    data.deadCount
  ]);
}

export async function getPercentage() {
  const url = `${endpoint}/overall`;
  const response = await got<Overall>(url, { responseType: "json" });
  const {
    confirmedCount,
    suspectedCount,
    seriousCount
  } = response.body.results[0];
  const total = confirmedCount + suspectedCount + seriousCount!;
  // const p1 = ;

  return [
    +(seriousCount! / total * 100).toFixed(1),
    +(confirmedCount! / total * 100).toFixed(1),
    +(suspectedCount! / total * 100).toFixed(1)
  ];
}

export function getMarkers() {
  return [
    { loc: "湖北", lon: "114.341861", lat: "30.546498" },
    { loc: "广东", lon: "113.266530", lat: "23.132191" },
    { loc: "浙江", lon: "120.152791", lat: "30.267446" },
    { loc: "河南", lon: "113.753602", lat: "34.765515" },
    { loc: "湖南", lon: "112.983810", lat: "28.112444" },
    { loc: "江西", lon: "115.909228", lat: "28.675696" },
    { loc: "安徽", lon: "117.284922", lat: "31.861184" },
    { loc: "重庆", lon: "106.551556", lat: "29.563009" },
    { loc: "江苏", lon: "118.763232", lat: "32.061707" },
    { loc: "山东", lon: "117.020359", lat: "36.668530" },
    { loc: "四川", lon: "104.075931", lat: "30.651651" },
    { loc: "北京", lon: "116.407526", lat: "39.904030" },
    { loc: "上海", lon: "121.473701", lat: "31.230416" },
    { loc: "黑龙江", lon: "126.661669", lat: "45.742347" },
    { loc: "福建", lon: "119.295144", lat: "26.100779" },
    { loc: "陕西", lon: "108.954239", lat: "34.265472" },
    { loc: "广西", lon: "108.327546", lat: "22.815478" },
    { loc: "河北", lon: "114.468664", lat: "38.037057" },
    { loc: "云南", lon: "102.710002", lat: "25.045806" },
    { loc: "海南", lon: "110.349228", lat: "20.017377" },
    { loc: "辽宁", lon: "123.429440", lat: "41.835441" },
    { loc: "山西", lon: "112.562398", lat: "37.873531" },
    { loc: "天津", lon: "117.200983", lat: "39.084158" },
    { loc: "贵州", lon: "106.707410", lat: "26.598194" },
    { loc: "甘肃", lon: "103.826308", lat: "36.059421" },
    { loc: "吉林", lon: "125.325990", lat: "43.896536" },
    { loc: "内蒙古", lon: "111.765617", lat: "40.817498" },
    { loc: "日本", lon: "139.69", lat: "35.70" },
    { loc: "宁夏", lon: "106.258754", lat: "38.471317" },
    { loc: "新疆", lon: "87.627704", lat: "43.793026" },
    { loc: "新加坡", lon: "103.51", lat: "1.18" },
    { loc: "泰国", lon: "100.31", lat: "13.45" },
    { loc: "香港", lon: "114.163825", lat: "22.276284" },
    { loc: "韩国", lon: "126.58", lat: "37.33" },
    { loc: "青海", lon: "101.780199", lat: "36.620901" },
    { loc: "台湾", lon: "121.508903", lat: "25.044319" },
    { loc: "澳大利亚", lon: "151.124", lat: "-33.5135" },
    { loc: "美国", lon: "-122.2", lat: "47.38" },
    { loc: "马来西亚", lon: "110", lat: "2" },
    { loc: "德国", lon: "11.3448", lat: "48.0820" },
    { loc: "越南", lon: "105.53", lat: "21.01" },
    { loc: "法国", lon: "2.201204", lat: "48.5139" },
    { loc: "加拿大", lon: "-79.25", lat: "43.40" },
    { loc: "阿联酋", lon: "55.307485", lat: "25.271139" },
    { loc: "印度", lon: "77.12", lat: "28.36" },
    { loc: "菲律宾", lon: "120.58", lat: "14.34" },
    { loc: "俄罗斯", lon: "37.37", lat: "55.45" },
    { loc: "英国", lon: "-0.734", lat: "51.30" },
    { loc: "意大利", lon: "12", lat: "41" },
    { loc: "西藏", lon: "91.117212", lat: "29.646922" }
  ];
}

async function run() {
  const a = await getPercentage();
  console.log(a);
}

// run();
