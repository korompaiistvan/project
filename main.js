// @ts-check
/// <reference path="./d3-declaration.d.ts" />
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

/** @typedef {'Females Married by 15' | 'Females Married by 18' | 'Males Married by 18'} Metric */
/** @typedef {{country: string, metric: Metric, value: number}} Datum */

function mapRecord(record) {
  return {
    country: record.country,
    metric: record.metric,
    value: +record.value,
  };
}

/** @type {d3.DSVParsedArray<Datum>} */
const data = await d3.tsv("/assets/data.csv", mapRecord);
const wideData = d3
  .groups(data, (d) => d.country)
  .map((item) => {
    const country = item[0];
    const records = item[1];
    const obj = { country };
    for (const record of records) {
      obj[record.metric] = record.value;
    }
    return obj;
  });

function topNByMetric(data, metric, n) {
  return data.sort((a, b) => b[metric] - a[metric]).slice(0, n);
}

const margin = {
  left: 96,
  top: 12,
  right: 12,
  bottom: 12,
};
const barChartContainer = d3.select("#bar-chart");
if (!barChartContainer) {
  throw new Error("No bar chart container found");
}
// @ts-ignore
const width = barChartContainer.node().clientWidth;
const height = 240;
const svg = d3
  .select("#bar-chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);
const metrics = [
  "Females Married by 15",
  "Females Married by 18",
  "Males Married by 18",
];
const selectedMetric = metrics[2];
const top5 = topNByMetric(wideData, selectedMetric, 5);

const xBandScale = d3
  .scaleBand()
  .domain(metrics)
  .range([margin.left, width - margin.right])
  .paddingInner(0.1);

const xLengthScale = d3
  .scaleLinear()
  .domain([0, 1])
  .range([0, xBandScale.bandwidth()]);

const yScale = d3
  .scaleBand()
  .domain(top5.map((d) => d.country))
  .range([margin.top, height - margin.bottom])
  .paddingInner(0.33);

const colorScale = d3.scaleOrdinal().domain(metrics).range(d3.schemeTableau10);

for (let i = 0; i < metrics.length; i++) {
  const metric = metrics[i];
  const bars = svg
    .append("g")
    .selectAll("rect")
    .data(top5)
    .enter()
    .append("rect")
    .attr("fill", (d) => colorScale(metric))
    // @ts-ignore
    .attr("x", xBandScale(metric))
    .attr("width", (d) => xLengthScale(d[metric]))
    // @ts-ignore
    .attr("y", (d) => yScale(d.country))
    .attr("height", yScale.bandwidth());
}

svg
  .append("g")
  .call(d3.axisLeft(yScale))
  .attr("transform", `translate(${margin.left}, 0)`);
