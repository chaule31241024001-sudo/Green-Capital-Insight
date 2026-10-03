import { useState } from 'react'
import { Building2, CalendarRange, Loader2, Play, RotateCcw, Save, Settings2 } from 'lucide-react'
import { useApp } from '../store'
import { DEFAULT_INPUTS, FUELS, INDUSTRIES, fmt, pct, validate, type Inputs } from '../model'
import { Banner, Button, Card, NumericInput, PageHead, Select, Tip } from '../components/ui'

const FIN: [keyof Inputs, string, string?][] = [
  ['ta', 'Total Assets', 'Book value at fiscal year end'], ['td', 'Total Debt', 'Short- and long-term interest-bearing debt'], ['revenue', 'Revenue', 'Net revenue; CTR denominator'],
  ['ebit', 'EBIT'], ['dep', 'Depreciation'], ['ppe', 'Tangible Fixed Assets / PPE'], ['mcap', 'Market Capitalization', 'Year-end market value of equity'],
]

export default function CompanyData() {
  const { inputs, setInputs, run, running, toast, companies, activeCompanyId, selectCompany, openCompanySetup } = useApp()
  const [tried, setTried] = useState(false)
  const v = validate(inputs)
  const set = (p: Partial<Inputs>) => setInputs({ ...inputs, ...p })
  const co2 = FUELS.reduce((s, f) => s + (inputs.fuel[f.key] ?? 0) * f.factor, 0)
  const rrf = inputs.ta && inputs.ta > 0 ? ((inputs.devFund ?? 0) + (inputs.finReserve ?? 0) + (inputs.retained ?? 0)) / inputs.ta : null
  const show = (k: string) => (tried || inputs[k as keyof Inputs] !== null) ? v.fields[k] : undefined

  return (
    <div className="pb-24">
      <PageHead n="01 · Capital Analysis" title="Input Analysis Data" sub={`Review or enter FY${inputs.year - 1} data for ${inputs.company} before running the technology model.`} actions={<Button onClick={openCompanySetup}><Settings2 size={15} />Company & Year Setup</Button>} />
      {tried && !v.ok && (
        <div className="mb-5"><Banner tone="error" title="Unable to complete analysis">Some required historical data is missing. Review the highlighted fields before trying again.
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[12.5px]">{[...Object.values(v.fields), ...v.global].map((m) => <li key={m}>{m}</li>)}</ul></Banner></div>
      )}
      <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
        <div className="space-y-5">
          <Card title="Company Information" eyebrow="Section 1">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Select label="Company" value={inputs.company} options={companies.map((company) => company.name)} onChange={(name) => { const company = companies.find((item) => item.name === name); if (company) selectCompany(company.id, inputs.year) }} />
              <div><div className="mb-1.5 text-[12.5px] font-medium text-[#334155]">Analysis Year (t)</div><button onClick={openCompanySetup} className="flex h-11 w-full items-center justify-between border border-line px-3 text-left hover:border-[#a8a29e]"><span className="flex items-center gap-2 text-[13.5px]"><CalendarRange size={15} className="text-mute" /><span className="font-mono font-medium">{inputs.year}</span></span><span className="text-[11.5px] text-mute">FY{inputs.year - 1} inputs</span></button></div>
              <Select className="sm:col-span-2" label="Industry" value={inputs.industry} options={Object.keys(INDUSTRIES)} onChange={(i) => set({ industry: i })} />
            </div>
            <div className="flex items-center gap-2 border-t border-line bg-[#fafbfc] px-5 py-3 text-[12px] text-mute"><Building2 size={14} /><span>Directory ID: <b className="font-mono text-ink">{companies.find((company) => company.id === activeCompanyId)?.code || activeCompanyId}</b></span></div>
            <div className="border-t border-line bg-[#fafbfc] px-5 py-3 text-[12.5px] text-mute">Inputs below correspond to <b className="font-mono font-medium text-ink">FY t−1 = {inputs.year - 1}</b>. Data from year t is never mixed into the analysis.</div>
            {v.global.filter((g) => !g.startsWith('Fuel')).map((g) => <div key={g} className="px-5 pb-4"><Banner tone="warn">{g}</Banner></div>)}
          </Card>
          <Card title="Financial Data" eyebrow="Section 2 · VND bn" action={<span className="text-[11.5px] text-mute"><span className="text-[#dc2626]">*</span> Required</span>}>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {FIN.map(([k, l, info]) => <NumericInput key={k} label={l} unit="VND bn" required info={info} value={inputs[k] as number | null} onChange={(x) => set({ [k]: x })} error={show(k)} />)}
            </div>
          </Card>
          <Card title={<span className="flex items-center gap-2">Internal Reserve Fund<Tip text="Internal reserve ratio used by the capital adjustment model." /></span>} eyebrow="Section 4 · VND bn">
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <NumericInput label="Development Fund" unit="bn" value={inputs.devFund} onChange={(x) => set({ devFund: x })} error={tried ? v.fields.devFund : undefined} />
              <NumericInput label="Financial Reserve" unit="bn" value={inputs.finReserve} onChange={(x) => set({ finReserve: x })} error={tried ? v.fields.finReserve : undefined} />
              <NumericInput label="Retained Earnings" unit="bn" value={inputs.retained} onChange={(x) => set({ retained: x })} error={tried ? v.fields.retained : undefined} />
            </div>
            <div className="flex items-center justify-between border-t border-line bg-[#f3f8fc] px-5 py-4"><span className="flex items-center gap-1.5 text-[13px] font-medium">RRF / Total Assets<Tip text="Internal reserve ratio used by the capital adjustment model." /></span><span className="tnum font-mono text-[20px] font-semibold text-navy">{rrf === null ? '—' : pct(rrf)}</span></div>
          </Card>
        </div>

        <Card title="Fuel Consumption" eyebrow="Section 3 · KTOE" action={<Tip text="Emission factors are read-only and managed through model configuration." />}>
          {v.global.some((g) => g.startsWith('Fuel')) && <div className="px-5 pt-4"><Banner tone="warn">Fuel consumption data is incomplete. Please review the missing values. Blank values are not assumed to be zero.</Banner></div>}
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead><tr className="font-mono text-[10.5px] tracking-[0.08em] text-mute uppercase">{['Fuel Type', 'Consumption', 'Unit', 'Emission Factor', 'Est. CO₂ (t)'].map((h, i) => <th key={h} className={`border-b border-line bg-[#fafbfc] px-4 py-2.5 font-medium ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
              <tbody>
                {FUELS.map((f) => {
                  const val = inputs.fuel[f.key], miss = val === null
                  return (
                    <tr key={f.key} className="border-b border-[#f0f2f5]">
                      <td className="px-4 py-2 font-medium">{f.name}{miss && <span className="ml-2 text-[11px] font-normal text-[#b45309]">Missing</span>}</td>
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
          <Button v="ghost" onClick={() => { setInputs({ ...DEFAULT_INPUTS, company: inputs.company, year: inputs.year, industry: inputs.industry }); setTried(false) }}><RotateCcw size={15} />Reset Inputs</Button>
          <Button onClick={() => { try { localStorage.setItem('gci:draft', JSON.stringify(inputs)); toast('Draft saved on this device') } catch { toast('Draft could not be saved in this browser.', 'error') } }}><Save size={15} />Save Draft</Button>
          <Button v="primary" disabled={running} onClick={() => { setTried(true); if (v.ok) run(); else toast('Review highlighted fields before running analysis.', 'error') }}>{running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}Run Analysis</Button>
        </div>
      </div>
    </div>
  )
}
