import { MODEL_VERSION, type Inputs, type Result } from "./model"

function safeName(value: string) {
  return value.trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()
}

export function downloadText(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadJson(value: unknown, filename: string) {
  downloadText(JSON.stringify(value, null, 2), filename, "application/json")
}

export function downloadCsv(rows: (string | number)[][], filename: string) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n")
  downloadText(`\uFEFF${csv}`, filename, "text/csv")
}

export function exportScenarioCsv(
  inputs: Inputs,
  baseline: Result,
  scenarioResult: ReturnType<typeof import("./model").scenario>,
  ctrReduction: number,
  rrfPercent: number,
) {
  downloadCsv([
    ["Green Capital Insight scenario", MODEL_VERSION],
    ["Company", inputs.company],
    ["Analysis year", inputs.year],
    ["CTR reduction assumption (%)", ctrReduction],
    ["RRF assumption (% TA)", rrfPercent],
    ["Metric", "Baseline", "Scenario"],
    ["CTR", baseline.ctr, scenarioResult.sCtr],
    ["RRF", baseline.rrf, scenarioResult.sRrf],
    ["Target LEV", baseline.tlev, baseline.tlev],
    ["DevLev", baseline.devlev, baseline.devlev],
    ["SOA", baseline.soa, scenarioResult.soa],
    ["Marginal effect CTR", baseline.me, scenarioResult.me],
    ["Expected LevAdj", baseline.levAdj, scenarioResult.levAdj],
    ["Expected debt adjustment", baseline.debtAdj, scenarioResult.debtAdj],
  ], `${safeName(inputs.company)}-${inputs.year}-scenario.csv`)
}
