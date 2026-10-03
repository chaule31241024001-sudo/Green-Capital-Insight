import {
  EXPECTED_LEV_ADJ_INTERCEPT,
  FUEL_EMISSION_COEFFICIENTS,
  INDLEV_TABLE,
  MACRO_TABLE,
  MODEL_VERSION,
  SCENARIO_CONFIG,
  SOA_COEFFICIENTS,
  TARGETLEV_COEFFICIENTS,
} from "./modelConfig"

export { MODEL_VERSION, SCENARIO_CONFIG }
export const FUELS = FUEL_EMISSION_COEFFICIENTS
export const TARGET_COEF = TARGETLEV_COEFFICIENTS
export const SOA_COEF = SOA_COEFFICIENTS
export type FuelKey = (typeof FUELS)[number]["key"]

export type Inputs = {
  company: string
  year: number
  industry: string
  ta: number | null
  td: number | null
  revenue: number | null
  ebit: number | null
  dep: number | null
  ppe: number | null
  mcap: number | null
  fuel: Record<FuelKey, number | null>
  devFund: number | null
  finReserve: number | null
  retained: number | null
}

export const INDUSTRIES = Object.fromEntries(
  Object.entries(INDLEV_TABLE).map(([industry, years]) => [industry, years[2023] ?? null]),
) as Record<string, number | null>
export const MACRO: Record<number, { gdp: number; inf: number } | null> = MACRO_TABLE

export const DEFAULT_INPUTS: Inputs = {
  company: "ABC Corporation",
  year: 2024,
  industry: "Construction materials",
  ta: 100000,
  td: 42000,
  revenue: 1424.7,
  ebit: 6800,
  dep: 2900,
  ppe: 38500,
  mcap: 71000,
  fuel: { coal: 6.2, gasoline: 0.4, jet: 0, kerosene: 0.04, do: 3.1, fo: 1.5, lpg: 0.1, ng: 1.8 },
  devFund: 4200,
  finReserve: 1700,
  retained: 4500,
}

export type ValidationResult = {
  fields: Record<string, string>
  global: string[]
  ok: boolean
}

export type Result = ReturnType<typeof analyze>

export function lookupIndustryLeverage(industry: string, inputYear: number) {
  return INDLEV_TABLE[industry]?.[inputYear] ?? null
}

export function validate(i: Inputs): ValidationResult {
  const fields: Record<string, string> = {}
  const required: [keyof Inputs, string][] = [
    ["ta", "Total Assets"],
    ["td", "Total Debt"],
    ["revenue", "Revenue"],
    ["ebit", "EBIT"],
    ["dep", "Depreciation"],
    ["ppe", "Tangible Fixed Assets"],
    ["mcap", "Market Capitalization"],
  ]

  required.forEach(([key, label]) => {
    if (typeof i[key] !== "number" || !Number.isFinite(i[key])) fields[key] = `${label} is required.`
  })
  if (i.ta !== null && i.ta <= 0) fields.ta = "Total Assets must be greater than zero."
  if (i.td !== null && i.td < 0) fields.td = "Total Debt cannot be negative."
  if (i.ta !== null && i.td !== null && i.ta - i.td === 0) {
    fields.td = "Market-to-book ratio cannot be calculated because book equity equals zero."
  }
  if (i.revenue !== null && i.revenue <= 0) {
    fields.revenue = "Revenue must be greater than zero to calculate Carbon Intensity."
  }
  if (i.ebit !== null && !Number.isFinite(i.ebit)) fields.ebit = "EBIT must be a finite number."
  if (i.dep !== null && i.dep < 0) fields.dep = "Depreciation cannot be negative."
  if (i.ppe !== null && i.ppe < 0) fields.ppe = "Tangible Fixed Assets cannot be negative."
  if (i.mcap !== null && i.mcap < 0) fields.mcap = "Market Capitalization cannot be negative."

  const reserveFields: [keyof Pick<Inputs, "devFund" | "finReserve" | "retained">, string][] = [
    ["devFund", "Development Fund"],
    ["finReserve", "Financial Reserve"],
    ["retained", "Retained Earnings"],
  ]
  reserveFields.forEach(([key, label]) => {
    if (typeof i[key] !== "number" || !Number.isFinite(i[key])) fields[key] = `${label} is required to calculate RRF.`
  })

  FUELS.forEach((fuel) => {
    const value = i.fuel[fuel.key]
    if (typeof value !== "number" || !Number.isFinite(value)) fields[`fuel.${fuel.key}`] = `${fuel.name} consumption is required.`
    else if (value < 0) fields[`fuel.${fuel.key}`] = `${fuel.name} consumption cannot be negative.`
  })

  const global: string[] = []
  const inputYear = i.year - 1
  if (!MACRO_TABLE[inputYear]) global.push(`GDP and inflation data are unavailable for FY${inputYear}.`)
  if (lookupIndustryLeverage(i.industry, inputYear) === null) {
    global.push(`Industry median leverage is unavailable for ${i.industry} in FY${inputYear}.`)
  }

  return { fields, global, ok: Object.keys(fields).length === 0 && global.length === 0 }
}

function assertValid(i: Inputs) {
  const validation = validate(i)
  if (!validation.ok) throw new Error([...Object.values(validation.fields), ...validation.global].join(" "))
}

export function analyze(i: Inputs) {
  assertValid(i)

  const ta = i.ta as number
  const td = i.td as number
  const revenue = i.revenue as number
  const inputYear = i.year - 1
  const macro = MACRO_TABLE[inputYear]
  const indlev = lookupIndustryLeverage(i.industry, inputYear) as number
  const fuelRows = FUELS.map((fuel) => {
    const kt = i.fuel[fuel.key] as number
    return { ...fuel, kt, co2: kt * fuel.factor }
  })
  const co2 = fuelRows.reduce((sum, row) => sum + row.co2, 0)
  const ctr = co2 / revenue
  const rrf = ((i.devFund as number) + (i.finReserve as number) + (i.retained as number)) / ta
  const vars = {
    Intercept: 1,
    PROF: (i.ebit as number) / ta,
    MTB: (i.mcap as number) / (ta - td),
    SIZE: Math.log(ta),
    DEP: (i.dep as number) / ta,
    TANG: (i.ppe as number) / ta,
    INDLEV: indlev,
    GDP: macro.gdp,
    Inflation: macro.inf,
  } satisfies Record<string, number>
  const lev = td / ta
  const targetRows = TARGET_COEF.map((coefficient) => ({
    ...coefficient,
    val: vars[coefficient.v],
    contrib: vars[coefficient.v] * coefficient.c,
  }))
  const tlev = targetRows.reduce((sum, row) => sum + row.contrib, 0)
  const devlev = tlev - lev
  const baseline = {
    ...vars,
    analysisYear: i.year,
    inputYear,
    ta,
    td,
    revenue,
    lev,
    tlev,
    devlev,
    co2,
    ctr,
    rrf,
    indlev,
    fuelRows,
    targetRows,
    targetDebt: tlev * ta,
  }

  return { ...baseline, ...scenario(baseline, ctr, rrf) }
}

export function scenario(
  baseline: { ta: number; devlev: number } & Record<string, unknown>,
  ctr: number,
  rrf: number,
) {
  const values: Record<string, number> = {
    ...(baseline as Record<string, number>),
    CTR: ctr,
    RRF: rrf,
    "CTR × RRF": ctr * rrf,
  }
  const soaRows = SOA_COEF.map((coefficient) => ({
    ...coefficient,
    val: values[coefficient.v],
    contrib: values[coefficient.v] * coefficient.c,
  }))
  const soa = soaRows.reduce((sum, row) => sum + row.contrib, 0)
  const me = SOA_COEF[1].c + SOA_COEF[3].c * rrf
  const levAdj = EXPECTED_LEV_ADJ_INTERCEPT + soa * baseline.devlev
  return {
    soa,
    me,
    levAdj,
    debtAdj: levAdj * baseline.ta,
    soaRows,
    sCtr: ctr,
    sRrf: rrf,
  }
}

export function scenarioCtrFromReduction(baselineCtr: number, reductionPercent: number) {
  return baselineCtr * (1 - reductionPercent / 100)
}

export function resultContract(result: Result) {
  return {
    model_version: MODEL_VERSION,
    analysis_year: result.analysisYear,
    input_year: result.inputYear,
    total_assets: result.ta,
    total_debt: result.td,
    revenue: result.revenue,
    co2_total: result.co2,
    ctr: result.ctr,
    size: result.SIZE,
    lev_lag: result.lev,
    prof: result.PROF,
    dep: result.DEP,
    tang: result.TANG,
    mtb: result.MTB,
    rrf: result.rrf,
    indlev: result.indlev,
    gdp: result.GDP,
    inflation: result.Inflation,
    target_lev: result.tlev,
    dev_lev: result.devlev,
    soa: result.soa,
    marginal_effect_ctr: result.me,
    expected_lev_adj: result.levAdj,
    target_debt: result.targetDebt,
    expected_debt_adjustment: result.debtAdj,
    scenario: {
      ctr: result.sCtr,
      rrf: result.sRrf,
      soa: result.soa,
      marginal_effect_ctr: result.me,
      expected_lev_adj: result.levAdj,
      expected_debt_adjustment: result.debtAdj,
    },
  }
}

export function buildTrend(result: Result) {
  const multipliers = [1.18, 1.14, 1.1, 1.07, 1.04, 1.02, 1]
  return multipliers.map((multiplier, index) => ({
    y: result.inputYear - (multipliers.length - 1 - index),
    ctr: result.ctr * multiplier,
    rrf: Math.max(0, result.rrf * (0.7 + index * 0.05) * 100),
  }))
}

export const fmt = (n: number, digits = 1) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
export const pct = (n: number, digits = 1) => `${fmt(n * 100, digits)}%`
export const pp = (n: number, digits = 1) => `${n >= 0 ? "+" : "−"}${fmt(Math.abs(n * 100), digits)} pp`
export const sgn = (n: number, digits = 0) => `${n >= 0 ? "+" : "−"}${fmt(Math.abs(n), digits)}`
