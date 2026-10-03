import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download, GitCompare, Lock, Loader2, RotateCcw, Save, SlidersHorizontal } from 'lucide-react'
import { useApp, type Saved } from '../store'
import { SCENARIO_CONFIG, fmt, pct, pp, scenario, scenarioCtrFromReduction, sgn } from '../model'
import { Badge, Button, Card, Drawer, Empty, Fixed, Modal, PageHead, Table, Tabs, Tip, cx } from '../components/ui'
import { C, ChartTip, axis } from '../components/charts'
import { exportScenarioCsv } from '../export'

const n4 = (v: number) => (v < 0 ? '−' : '') + fmt(Math.abs(v), 4)

function ScenarioSlider({ title, sub, min, max, step, value, onChange, unit, children }: { title: string; sub: string; min: number; max: number; step: number; value: number; onChange: (n: number) => void; unit: string; children: React.ReactNode }) {
  const p = ((value - min) / (max - min)) * 100
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div><h3 className="text-[15px] font-semibold">{title}</h3><p className="mt-0.5 text-[12.5px] text-mute">{sub}</p></div>
        <label className="flex h-10 items-center border border-line focus-within:border-blue">
          <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value))))} className="tnum h-full w-20 bg-transparent px-2 text-right font-mono text-[14px] outline-none" />
          <span className="border-l border-line px-2 text-[12px] text-mute">{unit}</span>
        </label>
      </div>
      <div className="relative mt-6">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" style={{ background: `linear-gradient(to right, ${C.blue} ${p}%, #e5e7eb ${p}%)`, height: 4, borderRadius: 4, appearance: 'none' }} />
        <div className="mt-2 flex justify-between font-mono text-[10.5px] text-mute"><span>{min}{unit}</span><span>{(min + max) / 2}{unit}</span><span>{max > 0 && min < 0 ? '+' : ''}{max}{unit}</span></div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">{children}</div>
    </Card>
  )
}

export default function Scenario() {
  const { result: r, go, ctrPct, setCtrPct, rrfS, setRrfS, saved, setSaved, toast, inputs } = useApp()
  const [metric, setMetric] = useState<'SOA' | 'Expected LevAdj' | 'Expected Debt Adjustment'>('SOA')
  const [saveOpen, setSaveOpen] = useState(false)
  const [cmp, setCmp] = useState(false)
  const [updating, setUpdating] = useState(false)
  useEffect(() => { setUpdating(true); const t = setTimeout(() => setUpdating(false), 220); return () => clearTimeout(t) }, [ctrPct, rrfS])

  const calc = useMemo(() => {
    if (!r) return null
    const sCtr = scenarioCtrFromReduction(r.ctr, ctrPct), sRrf = rrfS / 100
    return { s: scenario(r, sCtr, sRrf), ctrOnly: scenario(r, sCtr, r.rrf), rrfOnly: scenario(r, r.ctr, sRrf), sCtr, sRrf }
  }, [r, ctrPct, rrfS])
  if (!r || !calc) return <Card><Empty icon={<SlidersHorizontal size={24} />} title="No baseline available" text="Run a baseline analysis before creating scenarios." action={<Button v="primary" onClick={() => go('data')}>Run Baseline Analysis</Button>} /></Card>
  const { s } = calc

  const key = { SOA: 'soa', 'Expected LevAdj': 'levAdj', 'Expected Debt Adjustment': 'debtAdj' }[metric] as 'soa' | 'levAdj' | 'debtAdj'
  const k = key === 'debtAdj' ? 1 : 100
  const fm = (v: number) => (key === 'debtAdj' ? `${sgn(v)} bn` : key === 'soa' ? pct(v) : pp(v, 2))
  const chart = [{ n: 'Baseline', v: r[key] * k }, { n: 'Current Scenario', v: s[key] * k }, { n: 'CTR-only', v: calc.ctrOnly[key] * k }, { n: 'RRF-only', v: calc.rrfOnly[key] * k }]

  const kpis: [string, number, number, (v: number) => string, (d: number) => string][] = [
    ['Scenario SOA', s.soa, r.soa, pct, (d) => pp(d)],
    ['Marginal Effect of CTR', s.me, r.me, n4, (d) => sgn(d, 4)],
    ['Expected Leverage Adjustment', s.levAdj, r.levAdj, (v) => pp(v, 2), (d) => pp(d, 2)],
    ['Expected Debt Adjustment', s.debtAdj, r.debtAdj, (v) => `${sgn(v)} bn`, (d) => `${sgn(d)} bn`],
  ]
  const rel = (a: number, b: number) => (Math.abs(b) < 1e-9 ? '—' : `${a - b >= 0 ? '+' : '−'}${fmt(Math.abs((a - b) / b) * 100)}%`)
  const table: [string, number, number, (v: number) => string, (d: number) => string, boolean?][] = [
    ['CTR', r.ctr, calc.sCtr, (v) => fmt(v, 2), (d) => sgn(d, 2)], ['RRF', r.rrf, calc.sRrf, (v) => fmt(v, 3), (d) => sgn(d, 3)],
    ['Target LEV', r.tlev, r.tlev, pct, (d) => pp(d), true], ['DevLev', r.devlev, r.devlev, (v) => pp(v), (d) => pp(d), true],
    ...kpis.map(([l, a, b, f, d]) => [l.replace('Scenario ', ''), b, a, f, d] as [string, number, number, (v: number) => string, (d: number) => string]),
  ]

  return (
    <div className="space-y-6">
      <PageHead n="02 · Core Function" title="Scenario Simulation" sub="Explore how alternative climate-risk and internal-reserve assumptions affect the estimated capital adjustment path." actions={<>
        <Button v="ghost" onClick={() => { setCtrPct(0); setRrfS(+(r.rrf * 100).toFixed(1)); toast('Scenario reset to baseline', 'info') }}><RotateCcw size={15} />Reset to Baseline</Button>
        <Button onClick={() => setCmp(true)}><GitCompare size={15} />Compare Scenario</Button>
        <Button onClick={() => { exportScenarioCsv(inputs, r, s, ctrPct, rrfS); toast('Scenario exported (CSV)') }}><Download size={15} />Export</Button>
        <Button v="primary" onClick={() => setSaveOpen(true)}><Save size={15} />Save Scenario</Button></>} />

      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 divide-line sm:grid-cols-3 xl:grid-cols-6 xl:divide-x">
          {[['Company', inputs.company], ['Analysis Year', `${inputs.year} · FY${inputs.year - 1} data`], ['Baseline CTR', fmt(r.ctr, 2)], ['Baseline RRF', fmt(r.rrf, 3)], ['Target LEV', pct(r.tlev), true], ['DevLev', pp(r.devlev), true]].map(([l, v, lock]: any) => (
            <div key={l} className="px-5 py-4"><div className="flex items-center gap-1.5 text-[11.5px] text-mute">{l}{lock && <Lock size={11} />}</div><div className="tnum mt-1 truncate text-[15px] font-semibold">{v}</div></div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-line bg-[#f3f8fc] px-5 py-2.5 text-[12.5px] font-medium text-navy"><Lock size={13} />Target leverage and DevLev remain fixed during CTR/RRF scenario simulations.</div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <ScenarioSlider title="Carbon Intensity Scenario" sub="Emission reduction from baseline (negative values represent a stress increase)" min={SCENARIO_CONFIG.ctrReductionMin} max={SCENARIO_CONFIG.ctrReductionMax} step={SCENARIO_CONFIG.ctrReductionStep} value={ctrPct} onChange={setCtrPct} unit="%">
          <div><div className="text-[11.5px] text-mute">Scenario CTR</div><div className="tnum font-mono text-[20px] font-semibold">{fmt(calc.sCtr, 2)}</div></div>
          <div><div className="text-[11.5px] text-mute">Reduction · baseline {fmt(r.ctr, 2)}</div><div className="tnum font-mono text-[20px] font-semibold text-teal">{ctrPct > 0 ? '+' : ctrPct < 0 ? '−' : ''}{Math.abs(ctrPct)}%</div></div>
        </ScenarioSlider>
        <ScenarioSlider title="Internal Reserve Scenario" sub="RRF, % of Total Assets" min={SCENARIO_CONFIG.rrfMinPct} max={SCENARIO_CONFIG.rrfMaxPct} step={SCENARIO_CONFIG.rrfStepPct} value={rrfS} onChange={setRrfS} unit="%">
          <div><div className="text-[11.5px] text-mute">RRF scenario</div><div className="tnum font-mono text-[20px] font-semibold">{fmt(calc.sRrf, 3)}</div></div>
          <div><div className="text-[11.5px] text-mute">Baseline {fmt(r.rrf, 3)}</div><div className="tnum font-mono text-[20px] font-semibold text-purple">{sgn((calc.sRrf - r.rrf) * 100, 1)} pp</div></div>
        </ScenarioSlider>
      </div>

      <div>
        <div className="mb-3 flex h-5 items-center gap-2 text-[12px] text-mute">{updating ? <><Loader2 size={13} className="animate-spin text-teal" />Updating scenario…</> : <><span className="h-1.5 w-1.5 rounded-full bg-teal" />Scenario outputs up to date</>}</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(([l, a, b, f, d]) => (
            <Card key={l} className={cx('p-5 transition-opacity', updating && 'opacity-70')}>
              <div className="text-[12.5px] text-mute">{l}</div>
              <div className="tnum mt-2 text-[26px] leading-none font-semibold">{f(a)}</div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[12px]"><span className="text-mute">Baseline <span className="font-mono text-ink">{f(b)}</span></span><Badge tone={Math.abs(a - b) < 1e-9 ? 'neutral' : 'blue'}>{d(a - b)} · {rel(a, b)}</Badge></div>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Card title="Scenario vs Baseline" action={<Tabs size="sm" tabs={['SOA', 'Expected LevAdj', 'Expected Debt Adjustment'] as const} value={metric} onChange={setMetric} />}>
          <div className="h-[320px] p-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 200 }}>
              <BarChart data={chart} barSize={52}>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="n" {...axis} /><YAxis {...axis} unit={key === 'debtAdj' ? '' : key === 'soa' ? '%' : ' pp'} />
                <ReferenceLine y={0} stroke="#cbd5e1" />
                <Tooltip cursor={{ fill: '#f5f7fa' }} content={<ChartTip f={(v) => fm(v / k)} />} />
                <Bar dataKey="v" name={metric} radius={[4, 4, 0, 0]} isAnimationActive={false}>{chart.map((c, i) => <Cell key={c.n} fill={[C.navy, C.blue, '#7fcfc3', '#b9a3f5'][i]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Scenario Table">
          <Table dense head={['Metric', 'Baseline', 'Scenario', 'Abs. Δ', 'Rel. Δ']} align={['l', 'r', 'r', 'r', 'r']} rows={table.map(([l, b, a, f, d, fixed]) => [<span className="flex items-center gap-2 font-medium">{l}{fixed && <Fixed />}</span>, f(b), f(a), fixed ? <span className="text-mute">unchanged</span> : d(a - b), fixed ? '—' : rel(a, b)])} />
        </Card>
      </div>

      <SaveModal open={saveOpen} onClose={() => setSaveOpen(false)} onSave={(n, d) => { setSaved([...saved, { name: n, desc: d, ctr: ctrPct, rrf: rrfS }]); setSaveOpen(false); toast(`Scenario "${n}" saved`) }} />
      <Drawer open={cmp} onClose={() => setCmp(false)} title="Saved Scenario Comparison"><Compare saved={saved} /></Drawer>
    </div>
  )
}

function SaveModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (n: string, d: string) => void }) {
  const [n, setN] = useState(''), [d, setD] = useState(''), [err, setErr] = useState(false)
  return (
    <Modal open={open} onClose={onClose} title="Save Scenario" footer={<><Button onClick={onClose}>Cancel</Button><Button v="primary" onClick={() => (n.trim() ? (onSave(n.trim(), d), setN(''), setD(''), setErr(false)) : setErr(true))}>Save</Button></>}>
      <label className="block text-[12.5px] font-medium">Scenario Name <span className="text-[#dc2626]">*</span>
        <input value={n} onChange={(e) => setN(e.target.value)} placeholder="e.g. Fuel switch 2027" className={cx('mt-1.5 h-11 w-full border px-3 text-[13.5px] font-normal outline-none focus:border-blue', err ? 'border-[#737373]' : 'border-line')} />
        {err && <span className="mt-1 block text-[12px] font-normal text-[#b91c1c]">Scenario name is required.</span>}
      </label>
      <label className="mt-4 block text-[12.5px] font-medium">Description
        <textarea value={d} onChange={(e) => setD(e.target.value)} rows={3} className="mt-1.5 w-full border border-line p-3 text-[13.5px] font-normal outline-none focus:border-blue" />
      </label>
    </Modal>
  )
}

function Compare({ saved }: { saved: Saved[] }) {
  const { result: r } = useApp()
  const [sel, setSel] = useState<string[]>(saved.slice(0, 3).map((s) => s.name))
  if (!r) return null
  const rows = saved.map((sv) => ({ ...sv, o: scenario(r, scenarioCtrFromReduction(r.ctr, sv.ctr), sv.rrf / 100), sCtr: scenarioCtrFromReduction(r.ctr, sv.ctr) }))
  const picked = rows.filter((x) => sel.includes(x.name))
  const toggle = (n: string) => setSel((s) => (s.includes(n) ? s.filter((x) => x !== n) : s.length >= 3 ? s : [...s, n]))
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-mute">Select up to 3 scenarios to compare visually. <span className="font-mono text-ink">{sel.length}/3</span> selected.</p>
      <div className="overflow-hidden border border-line">
        <Table dense head={['', 'Scenario', 'CTR', 'RRF', 'SOA', 'Exp. LevAdj', 'Exp. Debt Adj.']} align={['l', 'l', 'r', 'r', 'r', 'r', 'r']} rows={rows.map((x) => [
          <input type="checkbox" checked={sel.includes(x.name)} disabled={!sel.includes(x.name) && sel.length >= 3} onChange={() => toggle(x.name)} className="h-4 w-4 accent-[#0B2A4A]" />,
          <span><span className="block font-medium">{x.name}</span><span className="text-[11.5px] text-mute">{x.desc}</span></span>, fmt(x.sCtr, 2), fmt(x.rrf / 100, 3), pct(x.o.soa), pp(x.o.levAdj, 2), sgn(x.o.debtAdj)])} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {(['soa', 'levAdj', 'debtAdj'] as const).map((m) => (
          <Card key={m} className="p-4">
            <div className="mb-2 flex items-center gap-1 text-[12px] font-semibold">{{ soa: 'SOA', levAdj: 'Expected LevAdj', debtAdj: 'Expected Debt Adj.' }[m]}<Tip text="Target LEV and DevLev fixed across scenarios" /></div>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 200 }}>
                <BarChart data={picked.map((p) => ({ n: p.name, v: m === 'debtAdj' ? p.o[m] : p.o[m] * 100 }))}>
                  <XAxis dataKey="n" hide /><YAxis {...axis} width={36} /><ReferenceLine y={0} stroke="#cbd5e1" />
                  <Tooltip cursor={{ fill: '#f5f7fa' }} content={<ChartTip f={(v) => fmt(v, m === 'debtAdj' ? 0 : 2)} />} />
                  <Bar dataKey="v" name="Value" radius={[3, 3, 0, 0]}>{picked.map((p, i) => <Cell key={p.name} fill={[C.navy, C.teal, C.purple][i]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-[12px]">{picked.map((p, i) => <span key={p.name} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: [C.navy, C.teal, C.purple][i] }} />{p.name}</span>)}</div>
    </div>
  )
}
