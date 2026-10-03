import type { FuelKey, Inputs } from './model'

export type ExtractedCompanyData = {
  inputs: Partial<Omit<Inputs, 'fuel'>> & { fuel?: Partial<Record<FuelKey, number | null>> }
  companyCode?: string
  country?: string
  mappedFields: string[]
}

const aliases: Record<string, string[]> = {
  company: ['company', 'company name', 'company_name', 'ten cong ty', 'tên công ty', 'doanh nghiep', 'doanh nghiệp'],
  companyCode: ['company code', 'company_code', 'code', 'ma cong ty', 'mã công ty'],
  country: ['country', 'quoc gia', 'quốc gia'],
  year: ['year', 'analysis year', 'analysis_year', 'nam', 'năm', 'nam phan tich', 'năm phân tích'],
  industry: ['industry', 'sector', 'nganh', 'ngành'],
  ta: ['ta', 'total assets', 'total_assets', 'tong tai san', 'tổng tài sản'],
  td: ['td', 'total debt', 'total_debt', 'tong no', 'tổng nợ'],
  revenue: ['revenue', 'net revenue', 'net_revenue', 'doanh thu', 'doanh_thu'],
  ebit: ['ebit', 'loi nhuan truoc lai vay va thue', 'lợi nhuận trước lãi vay và thuế'],
  dep: ['dep', 'depreciation', 'khau hao', 'khấu hao'],
  ppe: ['ppe', 'tangible fixed assets', 'tangible_fixed_assets', 'tai san co dinh huu hinh', 'tài sản cố định hữu hình'],
  mcap: ['mcap', 'market capitalization', 'market_capitalization', 'von hoa thi truong', 'vốn hóa thị trường'],
  devFund: ['devfund', 'dev fund', 'development fund', 'development_fund', 'quy dau tu phat trien', 'quỹ đầu tư phát triển'],
  finReserve: ['finreserve', 'financial reserve', 'financial_reserve', 'quy du phong tai chinh', 'quỹ dự phòng tài chính'],
  retained: ['retained', 'retained earnings', 'retained_earnings', 'loi nhuan giu lai', 'lợi nhuận giữ lại'],
  coal: ['coal', 'fuel coal', 'fuel_coal', 'than'],
  gasoline: ['gasoline', 'fuel gasoline', 'fuel_gasoline', 'xang', 'xăng'],
  jet: ['jet', 'jet fuel', 'fuel_jet', 'nhien lieu phan luc', 'nhiên liệu phản lực'],
  kerosene: ['kerosene', 'fuel kerosene', 'fuel_kerosene', 'dau hoa', 'dầu hỏa'],
  do: ['do', 'diesel', 'fuel do', 'fuel_do', 'dau do', 'dầu do'],
  fo: ['fo', 'fuel oil', 'fuel fo', 'fuel_fo', 'dau fo', 'dầu fo'],
  lpg: ['lpg', 'fuel lpg', 'fuel_lpg'],
  ng: ['ng', 'natural gas', 'natural_gas', 'fuel ng', 'fuel_ng', 'khi tu nhien', 'khí tự nhiên'],
}

const fuelKeys = new Set<FuelKey>(['coal', 'gasoline', 'jet', 'kerosene', 'do', 'fo', 'lpg', 'ng'])

function normalize(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-./]+/g, ' ').replace(/\s+/g, ' ')
}

const aliasIndex = Object.fromEntries(Object.entries(aliases).flatMap(([field, names]) => names.map((name) => [normalize(name), field])))

function flatten(value: unknown, prefix = '', output: Record<string, unknown> = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return output
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix} ${key}` : key
    if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, path, output)
    else {
      output[normalize(key)] = child
      output[normalize(path)] = child
    }
  }
  return output
}

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) throw new Error('CSV requires a header row and a data row.')
  const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ';' : ','
  const read = (line: string) => {
    const cells: string[] = []
    let current = '', quoted = false
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index]
      if (char === '"' && line[index + 1] === '"' && quoted) { current += '"'; index += 1 }
      else if (char === '"') quoted = !quoted
      else if (char === delimiter && !quoted) { cells.push(current.trim()); current = '' }
      else current += char
    }
    cells.push(current.trim())
    return cells
  }
  const headers = read(lines[0])
  const values = read(lines[1])
  return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
}

function asNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || !value.trim()) return null
  const cleaned = value.trim().replace(/\s/g, '').replace(/,(?=\d{3}(?:\D|$))/g, '')
  const parsed = Number(cleaned.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export function extractCompanyData(text: string, fileName = 'data.json'): ExtractedCompanyData {
  const source = fileName.toLowerCase().endsWith('.csv') ? parseCsv(text) : JSON.parse(text)
  const flat = flatten(source)
  const matched: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(flat)) {
    const field = aliasIndex[normalize(key)]
    if (field && matched[field] === undefined) matched[field] = value
  }

  const inputs: ExtractedCompanyData['inputs'] = {}
  const fuel: Partial<Record<FuelKey, number | null>> = {}
  const mappedFields: string[] = []
  for (const [field, value] of Object.entries(matched)) {
    if (field === 'companyCode' || field === 'country') { mappedFields.push(field); continue }
    if (fuelKeys.has(field as FuelKey)) {
      fuel[field as FuelKey] = asNumber(value)
      mappedFields.push(`fuel.${field}`)
      continue
    }
    if (field === 'company' || field === 'industry') {
      const textValue = String(value ?? '').trim()
      if (textValue) { Object.assign(inputs, { [field]: textValue }); mappedFields.push(field) }
      continue
    }
    const numeric = asNumber(value)
    if (numeric !== null) { Object.assign(inputs, { [field]: numeric }); mappedFields.push(field) }
  }
  if (Object.keys(fuel).length) inputs.fuel = fuel
  return {
    inputs,
    companyCode: matched.companyCode ? String(matched.companyCode).trim() : undefined,
    country: matched.country ? String(matched.country).trim() : undefined,
    mappedFields,
  }
}

export const COMPANY_DATA_TEMPLATE = `company,company_code,country,year,industry,total_assets,total_debt,revenue,ebit,depreciation,ppe,market_capitalization,development_fund,financial_reserve,retained_earnings,coal,gasoline,jet,kerosene,do,fo,lpg,natural_gas\nABC Corporation,ABC,Vietnam,2024,Construction materials,100000,42000,1424.7,6800,2900,38500,71000,4200,1700,4500,6.2,0.4,0,0.04,3.1,1.5,0.1,1.8`

