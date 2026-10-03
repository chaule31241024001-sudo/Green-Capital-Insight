import { useState, type ChangeEvent } from 'react'
import { Building2, CalendarRange, Download, FileUp, Loader2, Play, RotateCcw, Save, Settings2 } from 'lucide-react'
import { useApp } from '../store'
import { DEFAULT_INPUTS, FUELS, INDUSTRIES, fmt, pct, validate, type Inputs } from '../model'
import { COMPANY_DATA_TEMPLATE, extractCompanyData, type ExtractedCompanyData } from '../companyDataExtractor'
import { tr } from '../i18n'
import { Banner, Button, Card, Modal, NumericInput, PageHead, Select, Tip } from '../components/ui'

const FIN: [keyof Inputs, string, string?][] = [
  ['ta', 'Total Assets', 'Book value at fiscal year end'], ['td', 'Total Debt', 'Short- and long-term interest-bearing debt'], ['revenue', 'Revenue', 'Net revenue; CTR denominator'],
  ['ebit', 'EBIT'], ['dep', 'Depreciation'], ['ppe', 'Tangible Fixed Assets / PPE'], ['mcap', 'Market Capitalization', 'Year-end market value of equity'],
]

export default function CompanyData() {
  const { inputs, setInputs, importCompanyData, run, running, toast, companies, activeCompanyId, selectCompany, openCompanySetup, language } = useApp()
  const t = (text: string) => tr(language, text)
  const [tried, setTried] = useState(false)
  const [extractOpen, setExtractOpen] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedCompanyData | null>(null)
  const [extractError, setExtractError] = useState('')
  const [extractFile, setExtractFile] = useState('')
  const v = validate(inputs)
  const set = (p: Partial<Inputs>) => setInputs({ ...inputs, ...p })
  const co2 = FUELS.reduce((s, f) => s + (inputs.fuel[f.key] ?? 0) * f.factor, 0)
  const rrf = inputs.ta && inputs.ta > 0 ? ((inputs.devFund ?? 0) + (inputs.finReserve ?? 0) + (inputs.retained ?? 0)) / inputs.ta : null
  const show = (k: string) => (tried || inputs[k as keyof Inputs] !== null) ? v.fields[k] : undefined
  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setExtractFile(file.name); setExtractError(''); setExtracted(null)
    try {
      const data = extractCompanyData(await file.text(), file.name)
      if (!data.mappedFields.length) throw new Error(t('No supported fields were found in this file.'))
      setExtracted(data)
    } catch (error) {
      setExtractError(error instanceof Error && error.message.startsWith('No supported') ? error.message : t('Unable to read this file. Check its JSON or CSV format.'))
    }
  }
  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([COMPANY_DATA_TEMPLATE], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'company-data-template.csv'; anchor.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="pb-24">
      <PageHead n={`01 · ${t('Capital Analysis')}`} title={t('Input Analysis Data')} sub={language === 'vi' ? `Kiểm tra hoặc nhập dữ liệu FY${inputs.year - 1} của ${inputs.company} trước khi chạy mô hình.` : `Review or enter FY${inputs.year - 1} data for ${inputs.company} before running the technology model.`} actions={<><Button onClick={() => { setExtractOpen(true); setExtractError(''); setExtracted(null); setExtractFile('') }}><FileUp size={15} />{t('Extract data')}</Button><Button onClick={openCompanySetup}><Settings2 size={15} />{t('Company & year setup')}</Button></>} />
      {tried && !v.ok && (
        <div className="mb-5"><Banner tone="error" title="Unable to complete analysis">Some required historical data is missing. Review the highlighted fields before trying again.
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[12.5px]">{[...Object.values(v.fields), ...v.global].map((m) => <li key={m}>{m}</li>)}</ul></Banner></div>
      )}
      <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
        <div className="space-y-5">
          <Card title={t('Company Information')} eyebrow="Section 1">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Select label={t('Company')} value={inputs.company} options={companies.map((company) => company.name)} onChange={(name) => { const company = companies.find((item) => item.name === name); if (company) selectCompany(company.id, inputs.year) }} />
              <div><div className="mb-1.5 text-[12.5px] font-medium text-[#334155]">{t('Analysis Year (t)')}</div><button onClick={openCompanySetup} className="flex h-11 w-full items-center justify-between border border-line px-3 text-left hover:border-[#a8a29e]"><span className="flex items-center gap-2 text-[13.5px]"><CalendarRange size={15} className="text-mute" /><span className="font-mono font-medium">{inputs.year}</span></span><span className="text-[11.5px] text-mute">FY{inputs.year - 1} inputs</span></button></div>
              <Select className="sm:col-span-2" label={t('Industry')} value={inputs.industry} options={Object.keys(INDUSTRIES)} onChange={(i) => set({ industry: i })} />
            </div>
            <div className="flex items-center gap-2 border-t border-line bg-[#fafbfc] px-5 py-3 text-[12px] text-mute"><Building2 size={14} /><span>Directory ID: <b className="font-mono text-ink">{companies.find((company) => company.id === activeCompanyId)?.code || activeCompanyId}</b></span></div>
            <div className="border-t border-line bg-[#fafbfc] px-5 py-3 text-[12.5px] text-mute">Inputs below correspond to <b className="font-mono font-medium text-ink">FY t−1 = {inputs.year - 1}</b>. Data from year t is never mixed into the analysis.</div>
            {v.global.filter((g) => !g.startsWith('Fuel')).map((g) => <div key={g} className="px-5 pb-4"><Banner tone="warn">{g}</Banner></div>)}
          </Card>
          <Card title={t('Financial Data')} eyebrow="Section 2 · VND bn" action={<span className="text-[11.5px] text-mute"><span className="text-[#dc2626]">*</span> {t('Required')}</span>}>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {FIN.map(([k, l, info]) => <NumericInput key={k} label={t(l)} unit="VND bn" required info={info} value={inputs[k] as number | null} onChange={(x) => set({ [k]: x })} error={show(k)} />)}
            </div>
          </Card>
          <Card title={<span className="flex items-center gap-2">{t('Internal Reserve Fund')}<Tip text="Internal reserve ratio used by the capital adjustment model." /></span>} eyebrow="Section 4 · VND bn">
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <NumericInput label={t('Development Fund')} unit="bn" value={inputs.devFund} onChange={(x) => set({ devFund: x })} error={tried ? v.fields.devFund : undefined} />
              <NumericInput label={t('Financial Reserve')} unit="bn" value={inputs.finReserve} onChange={(x) => set({ finReserve: x })} error={tried ? v.fields.finReserve : undefined} />
              <NumericInput label={t('Retained Earnings')} unit="bn" value={inputs.retained} onChange={(x) => set({ retained: x })} error={tried ? v.fields.retained : undefined} />
            </div>
            <div className="flex items-center justify-between border-t border-line bg-[#f3f8fc] px-5 py-4"><span className="flex items-center gap-1.5 text-[13px] font-medium">RRF / Total Assets<Tip text="Internal reserve ratio used by the capital adjustment model." /></span><span className="tnum font-mono text-[20px] font-semibold text-navy">{rrf === null ? '—' : pct(rrf)}</span></div>
          </Card>
        </div>

        <Card title={t('Fuel Consumption')} eyebrow="Section 3 · KTOE" action={<Tip text="Emission factors are read-only and managed through model configuration." />}>
          {v.global.some((g) => g.startsWith('Fuel')) && <div className="px-5 pt-4"><Banner tone="warn">Fuel consumption data is incomplete. Please review the missing values. Blank values are not assumed to be zero.</Banner></div>}
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead><tr className="font-mono text-[10.5px] tracking-[0.08em] text-mute uppercase">{['Fuel Type', 'Consumption', 'Unit', 'Emission Factor', 'Est. CO₂ (t)'].map((h, i) => <th key={h} className={`border-b border-line bg-[#fafbfc] px-4 py-2.5 font-medium ${i > 1 ? 'text-right' : 'text-left'}`}>{t(h)}</th>)}</tr></thead>
              <tbody>
                {FUELS.map((f) => {
                  const val = inputs.fuel[f.key], miss = val === null
                  return (
                    <tr key={f.key} className="border-b border-[#f0f2f5]">
                      <td className="px-4 py-2 font-medium">{f.name}{miss && <span className="ml-2 text-[11px] font-normal text-[#b45309]">{t('Missing')}</span>}</td>
                      <td className="w-36 px-4 py-2"><NumericInput compact value={val} onChange={(x) => set({ fuel: { ...inputs.fuel, [f.key]: x } })} error={tried ? v.fields[`fuel.${f.key}`] : undefined} /></td>
                      <td className="px-4 py-2 text-right text-mute">KTOE</td>
                      <td className="tnum px-4 py-2 text-right font-mono text-[12.5px] text-mute">{fmt(f.factor, 1)}</td>
                      <td className="tnum px-4 py-2 text-right font-mono text-[12.5px]">{miss ? '—' : fmt(val * f.factor, 0)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot><tr className="bg-[#f3f8fc]"><td colSpan={4} className="px-4 py-4 font-semibold">Estimated Total CO₂</td><td className="tnum px-4 py-4 text-right font-mono text-[18px] font-semibold text-navy">{fmt(co2, 0)} <span className="text-[11px] font-normal text-mute">tCO₂</span></td></tr></tfoot>
            </table>
          </div>
          <div className="px-5 py-3 text-[11.5px] text-mute">No error term (δ) or coefficient is requested as input. All model parameters are loaded from configuration.</div>
        </Card>
      </div>

      <div className="fixed right-0 bottom-0 left-0 z-20 border-t border-line bg-white/95 backdrop-blur md:left-[var(--sb,264px)]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-end gap-2 px-4 py-3 lg:px-8">
          {running && <span className="mr-auto flex items-center gap-2 text-[13px] text-mute"><Loader2 size={15} className="animate-spin text-teal" />Calculating climate-risk and capital-structure indicators…</span>}
          <Button v="ghost" onClick={() => { setInputs({ ...DEFAULT_INPUTS, company: inputs.company, year: inputs.year, industry: inputs.industry }); setTried(false) }}><RotateCcw size={15} />{t('Reset Inputs')}</Button>
          <Button onClick={() => { try { localStorage.setItem('gci:draft', JSON.stringify(inputs)); toast('Draft saved on this device') } catch { toast('Draft could not be saved in this browser.', 'error') } }}><Save size={15} />{t('Save Draft')}</Button>
          <Button v="primary" disabled={running} onClick={() => { setTried(true); if (v.ok) run(); else toast('Review highlighted fields before running analysis.', 'error') }}>{running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}{t('Run Analysis')}</Button>
        </div>
      </div>
      <Modal open={extractOpen} onClose={() => setExtractOpen(false)} title={t('Extract Company Data')} footer={<><Button onClick={() => setExtractOpen(false)}>{t('Cancel')}</Button><Button v="primary" disabled={!extracted} onClick={() => { if (!extracted) return; importCompanyData(extracted); setExtractOpen(false); toast(t('Company data imported successfully.')) }}>{t('Apply extracted data')}</Button></>}>
        <p className="text-[13px] leading-relaxed text-mute">{t('Import a JSON or CSV file to populate company, financial, fuel and reserve inputs.')}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center border border-dashed border-[#a8a29e] bg-[#fafaf9] px-4 text-center hover:border-ink"><FileUp size={20} /><span className="mt-2 text-[12.5px] font-medium">{t('Choose JSON or CSV file')}</span><span className="mt-1 max-w-full truncate text-[11px] text-mute">{extractFile || '.json, .csv'}</span><input type="file" accept=".json,.csv,application/json,text/csv" onChange={readFile} className="sr-only" /></label>
          <button onClick={downloadTemplate} className="flex min-h-28 flex-col items-center justify-center border border-line px-4 text-center hover:border-ink"><Download size={20} /><span className="mt-2 text-[12.5px] font-medium">{t('Download template')}</span><span className="mt-1 text-[11px] text-mute">company-data-template.csv</span></button>
        </div>
        {extractError && <div className="mt-4"><Banner tone="error">{extractError}</Banner></div>}
        {extracted && <div className="mt-4 border border-line"><div className="border-b border-line bg-[#fafaf9] px-4 py-2.5 text-[12px] font-semibold">{t('Mapped fields')} · {extracted.mappedFields.length}</div><div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto p-4">{extracted.mappedFields.map((field) => <span key={field} className="border border-line bg-white px-2 py-1 font-mono text-[10.5px]">{field}</span>)}</div></div>}
      </Modal>
    </div>
  )
}
