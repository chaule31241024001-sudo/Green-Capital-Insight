import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { extractCompanyData } from './companyDataExtractor'

describe('company data extractor', () => {
  it('extracts nested JSON with English field names', () => {
    const result = extractCompanyData(JSON.stringify({ company: { name: 'Demo JSC', code: 'DMC', industry: 'Chemicals' }, financial: { total_assets: 1000, total_debt: 300 }, fuel: { coal: 2.5 } }))
    expect(result.inputs.company).toBe('Demo JSC')
    expect(result.inputs.ta).toBe(1000)
    expect(result.inputs.td).toBe(300)
    expect(result.inputs.fuel?.coal).toBe(2.5)
    expect(result.companyCode).toBe('DMC')
  })

  it('extracts CSV with Vietnamese field names', () => {
    const result = extractCompanyData('Tên công ty;Năm phân tích;Tổng tài sản;Tổng nợ;Doanh thu;Than\nCông ty X;2024;5000;1200;3300;1,5', 'data.csv')
    expect(result.inputs.company).toBe('Công ty X')
    expect(result.inputs.year).toBe(2024)
    expect(result.inputs.ta).toBe(5000)
    expect(result.inputs.fuel?.coal).toBe(1.5)
  })

  it('extracts the bundled Vietnamese sample file', () => {
    const sample = readFileSync(new URL('../du-lieu-cong-ty-mau.csv', import.meta.url), 'utf8')
    const result = extractCompanyData(sample, 'du-lieu-cong-ty-mau.csv')
    expect(result.inputs.company).toBe('Công ty Năng lượng Xanh Mẫu')
    expect(result.inputs.year).toBe(2024)
    expect(result.inputs.industry).toBe('Construction materials')
    expect(result.inputs.ta).toBe(100000)
    expect(result.inputs.fuel?.ng).toBe(1.8)
    expect(result.mappedFields).toHaveLength(23)
  })
})
