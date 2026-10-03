import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, Download, FunctionSquare, Gauge } from 'lucide-react'
import { useApp } from '../store'
import { FUELS, MODEL_VERSION, SOA_COEF, TARGET_COEF, fmt, pct, pp, sgn } from '../model'
import { EXPECTED_LEV_ADJ_INTERCEPT, MODEL_DIAGNOSTICS, SCENARIO_CONFIG } from '../modelConfig'
import { downloadJson } from '../export'
import { Accordion, Badge, Button, Card, Empty, Modal, PageHead, Stat, Table, Tabs, Tip } from '../components/ui'
import { C, ChartTip, axis } from '../components/charts'
import { tr } from '../i18n'

const TABS = ['Carbon & CTR', 'Target Leverage', 'Adjustment Speed', 'Model Coefficients', 'Diagnostics'] as const
const n4 = (v: number) => (v < 0 ? '−' : '') + fmt(Math.abs(v), 4)
const pv = (p: number) => Number.isNaN(p) ? <span className="text-mute">n/a</span> : <span className={p < 0.05 ? 'text-ink' : 'text-mute'}>{p < 0.001 ? '<0.001' : fmt(p, 3)}</span>

export function FormulaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { go } = useApp()
  return (
    <Modal wide open={open} onClose={onClose} title="Target Leverage Model" footer={<><Button onClick={onClose}>Close</Button><Button v="navy" onClick={() => { onClose(); go('analysis', 'Model Coefficients') }}>View Model Configuration</Button></>}>
      <div className="mb-4 flex flex-wrap gap-2"><Badge tone="navy">{MODEL_VERSION}</Badge><Badge tone="blue">FEM Step 1</Badge></div>
      <div className="border border-line bg-[#fafaf9] px-5 py-5 text-center font-serif text-[17px] leading-loose text-ink italic">
        LEV*<sub>i,t</sub> = β<sub>0</sub> + β<sub>1</sub>PROF + β<sub>2</sub>MTB + β<sub>3</sub>SIZE + β<sub>4</sub>DEP + β<sub>5</sub>TANG + β<sub>6</sub>INDLEV + β<sub>7</sub>GDP + β<sub>8</sub>INF
        <div className="mt-1 text-[13px] text-mute not-italic">all regressors measured at t−1 · DevLev = LEV* − LEV<sub>t−1</sub></div>
      </div>
      <div className="mt-4 overflow-hidden border border-line"><Table dense head={['Term', 'Coefficient', 'P-value', 'Description']} align={['l', 'r', 'r', 'l']} rows={TARGET_COEF.map((c, i) => [<span className="font-mono">β{i} · {c.v}</span>, n4(c.c), pv(c.p), <span className="text-mute">{c.d}</span>])} /></div>
      <p className="mt-4 text-[12.5px] text-mute italic">Coefficients are loaded from model configuration and are not defined in frontend components.</p>
    </Modal>
  )
}

export default function Analysis() {
  const { result: r, go, sub, toast, language } = useApp()
  const t = (text: string) => tr(language, text)
  const [tab, setTab] = useState<(typeof TABS)[number]>((sub as any) || 'Carbon & CTR')
  const [formula, setFormula] = useState(false)
  useEffect(() => { if (sub && TABS.includes(sub as (typeof TABS)[number])) setTab(sub as (typeof TABS)[number]) }, [sub])
  if (!r) return <Card><Empty icon={<Gauge size={24} />} title={t('No analysis selected')} text={t('Choose a company and analysis year to begin.')} action={<Button v="primary" onClick={() => go('data')}>{t('Start Analysis')}</Button>} /></Card>
  const fuelData = r.fuelRows.map((f) => ({ n: f.name.split(' —')[0], v: f.co2, s: f.co2 / r.co2 })).sort((a, b) => b.v - a.v)
  const kt = r.fuelRows.reduce((s, f) => s + f.kt, 0)

  return (
    <div className="space-y-6">
      <PageHead n="01 · Core Function" title={t('Capital Analysis')} sub={language === 'vi' ? 'Kiểm tra từng bước tính toán của mô hình đòn bẩy mục tiêu và tốc độ điều chỉnh.' : 'Inspect every intermediate calculation behind the target-leverage and adjustment-speed technology.'} actions={<Button onClick={() => go('data')}>{t('Edit Input Data')}</Button>} />
      <Tabs tabs={TABS} value={tab} onChange={setTab} labels={Object.fromEntries(TABS.map((item) => [item, t(item)]))} />

      {tab === 'Carbon & CTR' && (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Stat label="Total Fuel Consumption" value={<>{fmt(kt, 2)} <span className="text-[14px] text-mute">KTOE</span></>} />
            <Stat label="Total CO₂" value={<>{fmt(r.co2, 0)} <span className="text-[14px] text-mute">t</span></>} />
            <Stat label="Carbon Intensity — CTR" info="CTR = Total CO₂ / Revenue" value={fmt(r.ctr, 2)} sub="tCO₂ / VND bn revenue" />
            <Stat label="Revenue (FY t−1)" value={<>{fmt(r.ctr ? r.co2 / r.ctr : 0, 1)} <span className="text-[14px] text-mute">bn</span></>} sub="VND bn" />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
            <Card title="Fuel Emissions Breakdown" eyebrow="Contribution to total CO₂">
              <div className="h-[330px] p-4">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 200 }}>
                  <BarChart data={fuelData} layout="vertical" margin={{ left: 10, right: 50 }}>
                    <CartesianGrid stroke={C.grid} horizontal={false} />
                    <XAxis type="number" {...axis} />
                    <YAxis type="category" dataKey="n" {...axis} width={86} />
                    <Tooltip cursor={{ fill: '#f5f7fa' }} content={<ChartTip f={(v) => `${fmt(v, 0)} t`} />} />
                    <Bar dataKey="v" name="CO₂" barSize={16} radius={[0, 3, 3, 0]}>
                      {fuelData.map((d, i) => <Cell key={d.n} fill={i === 0 ? C.navy : i < 3 ? C.teal : '#9fb3c8'} />)}
                      <LabelList dataKey="s" position="right" formatter={(v: any) => pct(v)} style={{ fontSize: 11, fill: C.axis }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Fuel Detail" action={<Tip text="CTR = Total CO₂ / Revenue" />}>
              <Table dense head={['Fuel', 'Consumption KTOE', 'Emission Factor', 'CO₂ Contribution', '% of Total']} align={['l', 'r', 'r', 'r', 'r']} rows={r.fuelRows.map((f) => [f.name, fmt(f.kt, 2), fmt(f.factor, 1), fmt(f.co2, 0), pct(f.co2 / r.co2)])} />
            </Card>
          </div>
        </>
      )}

      {tab === 'Target Leverage' && (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
            <Card title="Actual Leverage vs Target Leverage" eyebrow="FEM Step 1 · FY t−1 inputs">
              <div className="h-[300px] p-4">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 200 }}>
                  <BarChart data={[{ n: 'Actual LEV (t−1)', v: r.lev * 100 }, { n: 'Target LEV', v: r.tlev * 100 }]} margin={{ top: 24 }} barSize={90}>
                    <CartesianGrid stroke={C.grid} vertical={false} />
                    <XAxis dataKey="n" {...axis} /><YAxis {...axis} unit="%" domain={[0, 60]} />
                    <Tooltip cursor={{ fill: '#f5f7fa' }} content={<ChartTip f={(v) => `${fmt(v)}%`} />} />
                    <Bar dataKey="v" name="Leverage" radius={[4, 4, 0, 0]}><Cell fill={C.navy} /><Cell fill={C.blue} /><LabelList dataKey="v" position="top" formatter={(v: any) => `${fmt(v)}%`} style={{ fontSize: 13, fontWeight: 600, fill: C.navy }} /></Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Actual LEV" value={pct(r.lev)} sub="Total Debt / Total Assets" />
              <Stat label="Target LEV" value={pct(r.tlev)} sub="Fitted LEV*" />
              <Stat label="Deviation (DevLev)" value={pp(r.devlev)} sub={r.devlev > 0 ? 'Below target' : 'Above target'} />
              <Stat label="Target Debt" value={fmt(r.targetDebt, 0)} sub="VND bn · LEV* × TA" />
            </div>
          </div>
          <Card title="Target Leverage Drivers" action={<Button className="h-8 text-[12.5px]" onClick={() => setFormula(true)}><FunctionSquare size={14} />View Formula</Button>}>
            <Table head={['Variable', 'Company Value', 'Coefficient', 'Contribution']} align={['l', 'r', 'r', 'r']} rows={r.targetRows.filter((x) => x.v !== 'Intercept').map((x) => [<span><span className="font-mono font-medium">{x.v}</span> <span className="ml-2 text-[12px] text-mute">{x.d}</span></span>, fmt(x.val, 4), n4(x.c), <ContribBar v={x.contrib} max={0.16} />])} />
          </Card>
        </>
      )}

      {tab === 'Adjustment Speed' && (
        <>
          <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
            <Card className="flex flex-col justify-between bg-navy p-6 text-white">
              <div className="font-mono text-[10.5px] tracking-[0.14em] text-[#8fa6bf] uppercase">System GMM estimate</div>
              <div><div className="text-[13px] text-[#c6d3e1]">Estimated Speed of Adjustment — SOA</div><div className="tnum mt-1 text-[48px] leading-none font-semibold">{pct(r.soa)}</div><div className="mt-3 text-[12px] text-[#8fa6bf]">Unbounded estimate; not clipped to 0–100%.</div></div>
            </Card>
            <Card title="Dependency Path" eyebrow="How inputs propagate">
              <div className="scroll-thin overflow-x-auto p-6">
                <div className="grid min-w-[640px] grid-cols-[140px_40px_1fr_40px_1fr_40px_1fr] items-center gap-y-3 text-[12.5px]">
                  <Node l="CTR" v={fmt(r.ctr, 2)} tone="teal" /><Arrow /><div className="row-span-2"><Node l="SOA" v={pct(r.soa)} tone="purple" big /></div><Arrow r2 /><div className="row-span-3"><Node l="Expected LevAdj" v={pp(r.levAdj, 2)} tone="blue" big /></div><Arrow r3 /><div className="row-span-3"><Node l="Expected Debt Adj." v={`${sgn(r.debtAdj)} bn`} tone="navy" big /></div>
                  <Node l="RRF" v={pct(r.rrf)} tone="teal" /><Arrow />
                  <Node l="DevLev" v={pp(r.devlev)} tone="neutral" /><div className="col-span-3 flex items-center"><span className="h-px flex-1 border-t border-dashed border-[#94a3b8]" /><ArrowRight size={14} className="text-[#94a3b8]" /></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-[12px] text-mute"><span>Marginal Effect of CTR = β<sub>CTR</sub> + β<sub>CTR×RRF</sub>·RRF = <b className="font-mono text-ink">{n4(r.me)}</b></span><span>Expected LevAdj = {EXPECTED_LEV_ADJ_INTERCEPT} + SOA × DevLev</span><span>Debt Adj = LevAdj × TA</span></div>
              </div>
            </Card>
          </div>
          <Card title="SOA Model Drivers" eyebrow="System GMM">
            <Table head={['Variable', 'Value', 'Coefficient', 'Estimated Contribution']} align={['l', 'r', 'r', 'r']} rows={r.soaRows.filter((x) => x.v !== 'Intercept').map((x) => [<span className="font-mono font-medium">{x.v}</span>, fmt(x.val, 4), n4(x.c), <ContribBar v={x.contrib} max={0.6} />])} />
          </Card>
        </>
      )}

      {tab === 'Model Coefficients' && (
        <Card title="Model Configuration" eyebrow={MODEL_VERSION} action={<Button className="h-8 text-[12.5px]" onClick={() => { downloadJson({ modelVersion: MODEL_VERSION, targetLeverage: TARGET_COEF, soa: SOA_COEF, expectedLevAdjIntercept: EXPECTED_LEV_ADJ_INTERCEPT, fuelEmissionFactors: FUELS, scenario: SCENARIO_CONFIG }, `${MODEL_VERSION}.json`); toast('Configuration downloaded (JSON)') }}><Download size={14} />Download configuration</Button>}>
          <div className="border-b border-line bg-[#fafbfc] px-5 py-3 text-[12.5px] text-mute">Read-only. Coefficients are governed by the research team and versioned in the model registry.</div>
          <Accordion defaultOpen title="Target Leverage Coefficients" meta={<Badge tone="green">Active</Badge>}><CoefTable rows={TARGET_COEF} /></Accordion>
          <Accordion title="SOA / System GMM Coefficients" meta={<Badge tone="green">Active</Badge>}><CoefTable rows={SOA_COEF} /></Accordion>
          <Accordion title="Fuel Emission Factors" meta={<Badge tone="green">Active</Badge>}><CoefTable rows={FUELS.map((f) => ({ v: f.name, c: f.factor, p: NaN, d: 'tCO₂ per KTOE' }))} /></Accordion>
          <Accordion title="Scenario Configuration" meta={<Badge tone="green">Active</Badge>}>
            <Table dense head={['Parameter', 'Value', 'Description', 'Status']} rows={[["CTR range", `${SCENARIO_CONFIG.ctrReductionMin}% … +${SCENARIO_CONFIG.ctrReductionMax}%`, 'Emission reduction from baseline CTR', 'Locked'], ['RRF range', `${SCENARIO_CONFIG.rrfMinPct}% … ${SCENARIO_CONFIG.rrfMaxPct}%`, 'Share of Total Assets', 'Locked'], ['Fixed outputs', 'Target LEV, DevLev', 'Held constant during CTR/RRF scenarios', 'Locked'], ['SOA bounds', 'None', 'Estimates are not clipped', 'Locked']].map((x) => [...x.slice(0, 3), <Badge>{x[3]}</Badge>])} />
          </Accordion>
        </Card>
      )}

      {tab === 'Diagnostics' && <Diagnostics />}
      <FormulaModal open={formula} onClose={() => setFormula(false)} />
    </div>
  )
}

export function Diagnostics() {
  const d = MODEL_DIAGNOSTICS
  return (
    <>
      <div className="grid grid-cols-3 gap-4"><Stat label="Observations" value={String(d.observations)} /><Stat label="Groups" value={String(d.groups)} /><Stat label="Instruments" value={String(d.instruments)} /></div>
      <Card title="Model Diagnostics" eyebrow="Research transparency">
        <Table head={['Test', 'P-value', 'Status', 'Interpretation']} align={['l', 'r', 'l', 'l']} rows={[
          ['AR(1)', fmt(d.ar1, 3), <Badge tone="blue">Significant</Badge>, 'First-order serial correlation expected in differenced residuals'],
          ['AR(2)', fmt(d.ar2, 3), <Badge tone="green">Not significant</Badge>, 'No evidence of second-order serial correlation'],
          ['Sargan', fmt(d.sargan, 3), <Badge tone="green">Do not reject</Badge>, 'Over-identifying restrictions not rejected'],
          ['Hansen', fmt(d.hansen, 3), <Badge tone="green">Do not reject</Badge>, 'Instrument set appears valid'],
        ].map((x) => [<span className="font-mono font-medium">{x[0]}</span>, ...x.slice(1)])} />
        <Accordion title="What do these tests mean?">
          <div className="grid gap-4 text-[13px] leading-relaxed text-[#334155] md:grid-cols-2">
            <p><b>Arellano–Bond AR(1)/AR(2).</b> In System GMM, first-differenced errors are expected to show first-order correlation. The absence of second-order correlation supports the validity of lagged instruments.</p>
            <p><b>Sargan / Hansen.</b> These test whether the over-identifying instruments are jointly exogenous. A p-value above conventional thresholds means the null of valid instruments is not rejected; it does not prove validity.</p>
          </div>
        </Accordion>
      </Card>
    </>
  )
}

function CoefTable({ rows }: { rows: readonly { v: string; c: number; p: number; d: string }[] }) {
  return <div className="overflow-hidden border border-line"><Table dense head={['Variable', 'Coefficient', 'P-value', 'Description', 'Version', 'Status']} align={['l', 'r', 'r', 'l', 'l', 'l']} rows={rows.map((x) => [<span className="font-mono font-medium">{x.v}</span>, n4(x.c), isNaN(x.p) ? <span className="text-mute">n/a</span> : pv(x.p), <span className="text-mute">{x.d}</span>, <span className="font-mono text-[11px]">V1</span>, <Badge tone="green">Active</Badge>])} /></div>
}

function ContribBar({ v, max }: { v: number; max: number }) {
  const w = Math.min(Math.abs(v) / max, 1) * 50
  return (
    <span className="inline-flex items-center gap-3">
      <span className="relative hidden h-2 w-28 rounded bg-[#f1f4f7] sm:block"><span className="absolute top-0 left-1/2 h-full w-px bg-[#cbd5e1]" /><span className="absolute top-0 h-full rounded" style={{ width: `${w}%`, left: v >= 0 ? '50%' : `${50 - w}%`, background: v >= 0 ? C.blue : C.purple }} /></span>
      <span className="w-16">{n4(v)}</span>
    </span>
  )
}
function Node({ l, v, tone, big }: { l: string; v: string; tone: 'teal' | 'purple' | 'blue' | 'navy' | 'neutral'; big?: boolean }) {
  const t = { teal: 'border-[#d6d3d1] bg-[#f5f5f4]', purple: 'border-[#d6d3d1] bg-[#fafaf9]', blue: 'border-[#a8a29e] bg-[#f5f5f4]', navy: 'border-navy bg-navy text-white', neutral: 'border-line bg-[#fafaf9]' }[tone]
  return <div className={`border px-3 ${big ? 'py-4' : 'py-2'} ${t}`}><div className={`text-[11px] ${tone === 'navy' ? 'text-[#d6d3d1]' : 'text-mute'}`}>{l}</div><div className="tnum font-mono text-[14px] font-semibold">{v}</div></div>
}
function Arrow({ r2, r3 }: { r2?: boolean; r3?: boolean }) {
  return <div className={`flex justify-center text-[#94a3b8] ${r2 ? 'row-span-2' : r3 ? 'row-span-3' : ''}`}><ArrowRight size={16} /></div>
}
