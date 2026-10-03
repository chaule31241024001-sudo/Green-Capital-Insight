import { describe, expect, it } from "vitest"
import { DEFAULT_INPUTS, analyze, scenario, scenarioCtrFromReduction, validate } from "./model"

const minimumInput = {
  ...DEFAULT_INPUTS,
  year: 2024,
  ta: 1000,
  td: 500,
  revenue: 1000,
  ebit: 80,
  dep: 25,
  ppe: 300,
  mcap: 750,
  devFund: 50,
  finReserve: 20,
  retained: 30,
  fuel: { coal: 1, gasoline: 0, jet: 0, kerosene: 0, do: 0, fo: 0, lpg: 0, ng: 0 },
}

describe("FSRA calculation engine", () => {
  it("recreates the minimum leverage, MTB and CTR checks", () => {
    const result = analyze(minimumInput)
    expect(result.lev).toBeCloseTo(0.5, 10)
    expect(result.MTB).toBeCloseTo(1.5, 10)
    expect(result.co2).toBeCloseTo(1122.1, 10)
    expect(result.ctr).toBeCloseTo(1.1221, 10)
  })

  it("applies the versioned FEM and full System GMM equations", () => {
    const result = analyze(minimumInput)
    const expectedTarget = -0.4092876
      - 0.1535634 * result.PROF
      + 0.0006456 * result.MTB
      + 0.0269935 * result.SIZE
      - 0.9945477 * result.DEP
      + 0.1363356 * result.TANG
      + 0.1977945 * result.INDLEV
      - 0.0006538 * result.GDP
      + 0.0132165 * result.Inflation
    const expectedSoa = 16.24263
      - 0.0519816 * result.ctr
      + 0.3302174 * result.rrf
      + 0.0412994 * result.ctr * result.rrf
      - 0.5101483 * result.SIZE
      + 0.1432794 * result.Inflation
      - 0.1723442 * result.PROF
      + 0.0950847 * result.TANG
      + 0.0005698 * result.MTB
      + 3.268288 * result.DEP
      - 3.404002 * result.INDLEV
      - 0.0243078 * result.GDP
    expect(result.tlev).toBeCloseTo(expectedTarget, 10)
    expect(result.soa).toBeCloseTo(expectedSoa, 10)
  })

  it.each([
    [0, -0.0519816],
    [0.1, -0.04785166],
    [0.3, -0.03959178],
  ])("calculates the marginal effect at RRF %s", (rrf, expected) => {
    const baseline = analyze(minimumInput)
    expect(scenario(baseline, baseline.ctr, rrf).me).toBeCloseTo(expected, 8)
  })

  it("keeps target leverage fixed while scenario outputs change", () => {
    const baseline = analyze(minimumInput)
    const changed = scenario(baseline, scenarioCtrFromReduction(baseline.ctr, 20), 0.2)
    expect(baseline.tlev).toBe(baseline.targetDebt / baseline.ta)
    expect(changed.soa).not.toBe(baseline.soa)
    expect(changed.levAdj).toBeCloseTo(-0.0222882 + changed.soa * baseline.devlev, 10)
  })

  it("blocks missing fuel instead of silently converting it to zero", () => {
    const invalid = { ...minimumInput, fuel: { ...minimumInput.fuel, coal: null } }
    expect(validate(invalid).ok).toBe(false)
    expect(() => analyze(invalid)).toThrow(/Coal consumption is required/)
  })
})
