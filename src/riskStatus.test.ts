import { describe, expect, it } from 'vitest'
import { emissionContributionStatus, leverageRiskStatus, soaRiskStatus } from './riskStatus'

describe('traffic-light risk status', () => {
  it('classifies leverage relative to target and a 5 pp warning gap', () => {
    expect(leverageRiskStatus(0.3, 0.35)).toBe('ok')
    expect(leverageRiskStatus(0.38, 0.35)).toBe('near')
    expect(leverageRiskStatus(0.41, 0.35)).toBe('warning')
  })

  it('classifies SOA using the report-anchored operational bands', () => {
    expect(soaRiskStatus(0.6)).toBe('ok')
    expect(soaRiskStatus(0.3)).toBe('near')
    expect(soaRiskStatus(0.9)).toBe('near')
    expect(soaRiskStatus(0.2)).toBe('warning')
    expect(soaRiskStatus(1.01)).toBe('warning')
    expect(soaRiskStatus(9.22)).toBe('warning')
  })

  it('classifies fuel contribution using 20% and 40% bands', () => {
    expect(emissionContributionStatus(0.1)).toBe('ok')
    expect(emissionContributionStatus(0.25)).toBe('near')
    expect(emissionContributionStatus(0.5)).toBe('warning')
  })
})
