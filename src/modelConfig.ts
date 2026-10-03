export const MODEL_VERSION = "GREEN CAPITAL INSIGHT_GMM_2026_V1"

export const FUEL_EMISSION_COEFFICIENTS = [
  { key: "coal", name: "Coal", factor: 1122.1 },
  { key: "gasoline", name: "Gasoline", factor: 791.0 },
  { key: "jet", name: "Jet Fuel", factor: 816.5 },
  { key: "kerosene", name: "Kerosene", factor: 816.5 },
  { key: "do", name: "Diesel — DO", factor: 845.8 },
  { key: "fo", name: "Fuel Oil — FO", factor: 883.4 },
  { key: "lpg", name: "LPG", factor: 720.2 },
  { key: "ng", name: "Natural Gas", factor: 640.6 },
] as const

export const TARGETLEV_COEFFICIENTS = [
  { v: "Intercept", c: -0.4092876, p: Number.NaN, d: "Model constant" },
  { v: "PROF", c: -0.1535634, p: Number.NaN, d: "EBIT / Total Assets" },
  { v: "MTB", c: 0.0006456, p: Number.NaN, d: "Market capitalization / book equity" },
  { v: "SIZE", c: 0.0269935, p: Number.NaN, d: "ln(Total Assets)" },
  { v: "DEP", c: -0.9945477, p: Number.NaN, d: "Depreciation / Total Assets" },
  { v: "TANG", c: 0.1363356, p: Number.NaN, d: "PPE / Total Assets" },
  { v: "INDLEV", c: 0.1977945, p: Number.NaN, d: "Industry-year median leverage" },
  { v: "GDP", c: -0.0006538, p: Number.NaN, d: "Real GDP growth (%)" },
  { v: "Inflation", c: 0.0132165, p: Number.NaN, d: "CPI inflation (%)" },
] as const

export const SOA_COEFFICIENTS = [
  { v: "Intercept", c: 16.24263, p: 0.009, d: "DevLev / SOA baseline" },
  { v: "CTR", c: -0.0519816, p: 0.001, d: "Carbon intensity" },
  { v: "RRF", c: 0.3302174, p: 0.359, d: "Internal reserve ratio" },
  { v: "CTR × RRF", c: 0.0412994, p: 0.353, d: "Climate-risk and reserve interaction" },
  { v: "SIZE", c: -0.5101483, p: 0.014, d: "ln(Total Assets)" },
  { v: "Inflation", c: 0.1432794, p: 0.062, d: "CPI inflation (%)" },
  { v: "PROF", c: -0.1723442, p: 0.69, d: "EBIT / Total Assets" },
  { v: "TANG", c: 0.0950847, p: 0.886, d: "PPE / Total Assets" },
  { v: "MTB", c: 0.0005698, p: 0.934, d: "Market-to-book ratio" },
  { v: "DEP", c: 3.268288, p: 0.114, d: "Depreciation / Total Assets" },
  { v: "INDLEV", c: -3.404002, p: 0.043, d: "Industry-year median leverage" },
  { v: "GDP", c: -0.0243078, p: 0.15, d: "Real GDP growth (%)" },
] as const

export const EXPECTED_LEV_ADJ_INTERCEPT = -0.0222882

export const SCENARIO_CONFIG = {
  ctrReductionMin: -50,
  ctrReductionMax: 50,
  ctrReductionStep: 1,
  rrfMinPct: 0,
  rrfMaxPct: 30,
  rrfStepPct: 0.5,
} as const

// Model data lives in a versioned lookup instead of presentation components.
export const INDLEV_TABLE: Record<string, Record<number, number>> = {
  "Construction materials": { 2016: 0.536566, 2017: 0.514251, 2018: 0.503847, 2019: 0.43495, 2020: 0.44499, 2021: 0.406781, 2022: 0.413147, 2023: 0.361602 },
  "Steel & metals": { 2016: 0.589519, 2017: 0.575251, 2018: 0.574871, 2019: 0.615923, 2020: 0.565359, 2021: 0.595358, 2022: 0.558527, 2023: 0.552975 },
  "Transportation & logistics": { 2016: 0.377185, 2017: 0.303678, 2018: 0.273466, 2019: 0.31346, 2020: 0.362252, 2021: 0.346452, 2022: 0.31981, 2023: 0.384143 },
  Chemicals: { 2016: 0.487398, 2017: 0.524274, 2018: 0.527907, 2019: 0.463497, 2020: 0.373574, 2021: 0.419427, 2022: 0.364934, 2023: 0.397706 },
  "Food processing": { 2016: 0.377924, 2017: 0.466677, 2018: 0.455138, 2019: 0.382737, 2020: 0.376525, 2021: 0.383092, 2022: 0.443488, 2023: 0.335039 },
  "Textiles & apparel": { 2016: 0.585714, 2017: 0.606452, 2018: 0.571087, 2019: 0.477075, 2020: 0.449428, 2021: 0.425159, 2022: 0.317025, 2023: 0.271049 },
}

// Percentage-point units match the estimation dataset.
export const MACRO_TABLE: Record<number, { gdp: number; inf: number }> = {
  2016: { gdp: 6.690009, inf: 2.668248 },
  2017: { gdp: 6.94019, inf: 3.520257 },
  2018: { gdp: 7.465007, inf: 3.539628 },
  2019: { gdp: 7.359263, inf: 2.795824 },
  2020: { gdp: 2.865413, inf: 3.220934 },
  2021: { gdp: 2.553729, inf: 1.834716 },
  2022: { gdp: 8.5375, inf: 3.156508 },
  2023: { gdp: 4.97866, inf: 3.252893 },
}

export const MODEL_DIAGNOSTICS = {
  observations: 934,
  groups: 147,
  instruments: 19,
  ar1: 0,
  ar2: 0.886,
  sargan: 0.37,
  hansen: 0.676,
} as const
