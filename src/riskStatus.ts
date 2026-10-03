export type RiskStatus = 'ok' | 'near' | 'warning'

/**
 * The full report establishes direction but does not prescribe traffic-light
 * cut-offs. These are transparent operational thresholds for the internal UI.
 * The report's statistically significant FEM estimates place SOA around 57.5–60.3%,
 * while values above 100% imply over-adjustment rather than a healthier outcome.
 */
export const RISK_THRESHOLDS = {
  emissionShareNear: 0.2,
  emissionShareWarning: 0.4,
  leverageWarningGapPp: 5,
  soaWarning: 0.25,
  soaOk: 0.4,
  soaNearHigh: 0.8,
  soaWarningHigh: 1,
} as const

export const RISK_COLORS: Record<RiskStatus, string> = {
  ok: '#2f8f5b',
  near: '#e3a008',
  warning: '#d64545',
}

export function leverageRiskStatus(actualLeverage: number, targetLeverage: number): RiskStatus {
  const gapPp = (actualLeverage - targetLeverage) * 100
  if (gapPp > RISK_THRESHOLDS.leverageWarningGapPp) return 'warning'
  if (gapPp > 0) return 'near'
  return 'ok'
}

export function emissionContributionStatus(share: number): RiskStatus {
  if (share > RISK_THRESHOLDS.emissionShareWarning) return 'warning'
  if (share >= RISK_THRESHOLDS.emissionShareNear) return 'near'
  return 'ok'
}

export function soaRiskStatus(soa: number): RiskStatus {
  if (soa < RISK_THRESHOLDS.soaWarning || soa > RISK_THRESHOLDS.soaWarningHigh) return 'warning'
  if (soa < RISK_THRESHOLDS.soaOk || soa > RISK_THRESHOLDS.soaNearHigh) return 'near'
  return 'ok'
}

