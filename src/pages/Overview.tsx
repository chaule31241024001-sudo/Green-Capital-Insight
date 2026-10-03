import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { ArrowRight, BookOpen, Factory, Lightbulb, Scale, SlidersHorizontal, Gauge, CalendarClock, Plus } from 'lucide-react'
import { useApp } from '../store'
import { buildTrend, fmt, pct, pp, scenario, sgn } from '../model'
import { Badge, Banner, Button, Card, Delta, Empty, PageHead, Table, Tabs, Tip, cx } from '../components/ui'
import { C, ChartTip, axis } from '../components/charts'

export function useScenarios() {
  const { result: r } = useApp()
  return useMemo(() => r && { base: r, ctrS: scenario(r, r.ctr * 0.8, r.rrf), rrfS: scenario(r, r.ctr, 0.15) }, [r])
}

export default function Overview() {
  const { result: r, go, inputs } = useApp()
  const s = useScenarios()
  const [hidden, setHidden] = useState<string[]>([])
  const [metric, setMetric] = useState<'SOA' | 'Expected LevAdj' | 'Debt Adjustment'>('SOA')
  if (!r || !s) return <Card><Empty icon={<Gauge size={24} />} title="No analysis selected" text="Choose a company and analysis year to begin." action={<Button v="primary" onClick={() => go('data')}><Plus size={15} />Start Analysis</Button>} /></Card>
  const trend = buildTrend(r)
  const ctrChange = ((trend.at(-1)!.ctr / trend.at(-2)!.ctr) - 1) * 100

  const below = r.devlev > 0
  const key = { SOA: 'soa', 'Expected LevAdj': 'levAdj', 'Debt Adjustment': 'debtAdj' }[metric] as 'soa' | 'levAdj' | 'debtAdj'
  const fm = (v: number) => (key === 'debtAdj' ? `${sgn(v)} bn` : key === 'soa' ? pct(v) : pp(v, 2))
  const bars = [{ n: 'Baseline', v: s.base[key] }, { n: 'CTR −20%', v: s.ctrS[key] }, { n: 'RRF 15%', v: s.rrfS[key] }].map((d) => ({ ...d, v: key === 'debtAdj' ? d.v : d.v * 100 }))

  const rows: [string, (x: any) => number, (v: number) => string, 'amount' | 'ratio'][] = [
    ['SOA', (x) => x.soa, (v) => pct(v), 'ratio'],
    ['Marginal Effect of CTR', (x) => x.me, (v) => (v < 0 ? '−' : '') + fmt(Math.abs(v), 4), 'ratio'],
    ['Expected Leverage Adjustment', (x) => x.levAdj, (v) => pp(v, 2), 'ratio'],
    ['Expected Debt Adjustment', (x) => x.debtAdj, (v) => `${sgn(v)} VND bn`, 'amount'],
  ]

  return (
    <div className="space-y-6">
      <PageHead n="Dashboard" title="Capital Structure Overview" sub="Internal climate-risk and capital-structure workspace for the selected company and analysis year." actions={<><Button onClick={() => go('data')}>Input Analysis Data</Button><Button v="primary" onClick={() => go('scenario')}><SlidersHorizontal size={15} />Scenario Simulation</Button></>} />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border border-line bg-[#f5f5f4] px-4 py-3 text-[13px]">
        <span className="flex items-center gap-2 font-semibold text-navy"><CalendarClock size={15} className="text-teal" />Analysis year: {inputs.year}</span>
        <span className="text-[#334155]">Calculations use <b className="font-mono font-medium">FY{inputs.year - 1}</b> financial, fuel, industry and macroeconomic data.</span>
        <span className="ml-auto text-[11.5px] text-mute italic">Figures shown are illustrative model outputs for {inputs.company}.</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="flex flex-col p-6">
          <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-[15px] font-semibold"><Factory size={16} className="text-teal" />Carbon Risk</h3><Badge tone="neutral">Model proxy</Badge></div>
          <div className="mt-5 text-[12.5px] text-mute">Total CO₂</div>
          <div className="tnum text-[30px] leading-tight font-semibold tracking-tight">{fmt(r.co2, 0)} <span className="text-[15px] font-medium text-mute">tCO₂</span></div>
          <div className="mt-4 flex items-end justify-between gap-4 border-t border-line pt-4">
            <div>
              <div className="flex items-center gap-1.5 text-[12.5px] text-mute">Carbon Intensity — CTR<Tip text="CTR = Total CO₂ / Revenue" /></div>
              <div className="tnum mt-1 text-[20px] font-semibold">{fmt(r.ctr, 2)} <span className="text-[12px] font-normal text-mute">tCO₂ / VND bn revenue</span></div>
              <div className="mt-1 text-[12px] text-teal">{ctrChange < 0 ? '▼' : '▲'} {fmt(Math.abs(ctrChange))}% vs FY{inputs.year - 2}</div>
            </div>
            <div className="h-12 w-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 200 }}><AreaChart data={trend}><defs><linearGradient id="sp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.teal} stopOpacity={0.25} /><stop offset="1" stopColor={C.teal} stopOpacity={0} /></linearGradient></defs><Area dataKey="ctr" stroke={C.teal} strokeWidth={1.75} fill="url(#sp)" /></AreaChart></ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col p-6">
          <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-[15px] font-semibold"><Scale size={16} className="text-blue" />Target Leverage</h3><Badge tone={below ? 'blue' : 'purple'}>{below ? 'Below target leverage' : 'Above target leverage'}</Badge></div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div><div className="text-[12px] text-mute">Actual LEV (t−1)</div><div className="tnum text-[26px] font-semibold">{pct(r.lev)}</div></div>
            <div><div className="text-[12px] text-mute">Target LEV</div><div className="tnum text-[26px] font-semibold text-blue">{pct(r.tlev)}</div></div>
            <div><div className="text-[12px] text-mute">Deviation</div><div className="tnum text-[26px] font-semibold">{pp(r.devlev)}</div></div>
          </div>
          <div className="mt-4 space-y-2">
            {[['Actual', r.lev, C.navy], ['Target', r.tlev, C.blue]].map(([l, v, c]: any) => (
              <div key={l} className="flex items-center gap-3 text-[11.5px]"><span className="w-12 text-mute">{l}</span><div className="relative h-2.5 flex-1 rounded-full bg-[#eef2f6]"><div className="h-full rounded-full" style={{ width: `${Math.min(v, 1) * 100 / 0.7}%`, background: c }} /></div><span className="tnum w-12 text-right font-mono">{pct(v)}</span></div>
            ))}
            <div className="flex justify-between pl-15 font-mono text-[10px] text-[#a0aec0]"><span>0%</span><span>35%</span><span>70%</span></div>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-line pt-3 text-[12.5px]"><span className="text-mute">Target Debt</span><span className="tnum font-mono font-medium">{fmt(r.targetDebt, 0)} VND bn</span></div>
        </Card>

        <Card className="flex flex-col p-6 lg:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-[15px] font-semibold"><Gauge size={16} className="text-purple" />Speed of Adjustment</h3><Tip text="SOA is an unbounded model estimate; it is not clipped to 0–100%." /></div>
          <div className="mt-5 flex items-end gap-4">
            <div><div className="text-[12.5px] text-mute">SOA</div><div className="tnum text-[30px] leading-tight font-semibold">{pct(r.soa)}</div></div>
            <div className="mb-2 flex-1">
              <div className="relative h-7">
                <div className="absolute inset-x-0 top-3 h-px bg-line" />
                {[-0.2, 0, 0.2, 0.4].map((t) => <span key={t} className="absolute top-1.5 h-3 w-px bg-[#cbd5e1]" style={{ left: `${((t + 0.2) / 0.6) * 100}%` }}><span className="absolute top-3.5 -translate-x-1/2 font-mono text-[9.5px] text-[#a0aec0]">{t * 100}%</span></span>)}
                <span className="absolute top-1 h-4 w-1 -translate-x-1/2 rounded bg-purple" style={{ left: `${Math.max(0, Math.min(1, (r.soa + 0.2) / 0.6)) * 100}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-[12px]">
            <div><div className="text-mute">Marginal Effect of CTR</div><div className="tnum mt-1 font-mono text-[15px] font-medium">{r.me < 0 ? '−' : ''}{fmt(Math.abs(r.me), 4)}</div></div>
            <div><div className="text-mute">Expected Lev. Adj.</div><div className="tnum mt-1 font-mono text-[15px] font-medium">{pp(r.levAdj, 2)}</div></div>
            <div><div className="text-mute">Expected Debt Adj.</div><div className="tnum mt-1 font-mono text-[15px] font-medium">{sgn(r.debtAdj)} <span className="text-[11px] text-mute">bn</span></div></div>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="CTR & Internal Reserve Trend" eyebrow={`FY${trend[0].y} – FY${trend.at(-1)!.y}`} action={<button onClick={() => go('analysis')} className="text-[12.5px] font-medium text-blue hover:underline">View details →</button>}>
          <div className="h-[280px] px-3 pt-4 pb-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 200 }}>
              <LineChart data={trend} margin={{ left: 0, right: 8, top: 5 }}>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="y" {...axis} />
                <YAxis yAxisId="l" {...axis} domain={[8, 11]} label={{ value: 'CTR', angle: -90, position: 'insideLeft', fill: C.axis, fontSize: 11 }} />
                <YAxis yAxisId="r" orientation="right" {...axis} domain={[6, 12]} unit="%" />
                <Tooltip content={<ChartTip f={(v, k) => (k === 'rrf' ? `${v}%` : `${v}`)} />} />
                <Legend onClick={(e: any) => setHidden((h) => (h.includes(e.dataKey) ? h.filter((x) => x !== e.dataKey) : [...h, e.dataKey]))} wrapperStyle={{ fontSize: 12, cursor: 'pointer' }} iconType="plainline" />
                <Line yAxisId="l" dataKey="ctr" name="CTR (tCO₂/VND bn)" stroke={C.teal} strokeWidth={2} dot={{ r: 3 }} hide={hidden.includes('ctr')} />
                <Line yAxisId="r" dataKey="rrf" name="RRF (% TA)" stroke={C.navy} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} hide={hidden.includes('rrf')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="SOA Under Alternative Scenarios" eyebrow="Baseline vs single-factor scenarios" action={<Tabs size="sm" tabs={['SOA', 'Expected LevAdj', 'Debt Adjustment'] as const} value={metric} onChange={setMetric} />}>
          <div className="h-[280px] px-3 pt-4 pb-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 200 }}>
              <BarChart data={bars} margin={{ left: 0, right: 8, top: 5 }} barSize={56}>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="n" {...axis} />
                <YAxis {...axis} unit={key === 'debtAdj' ? '' : key === 'soa' ? '%' : ' pp'} />
                <ReferenceLine y={0} stroke="#cbd5e1" />
                <Tooltip cursor={{ fill: '#f5f7fa' }} content={<ChartTip f={(v) => fm(key === 'debtAdj' ? v : v / 100)} />} />
                <Bar dataKey="v" name={metric} radius={[4, 4, 0, 0]} fill={C.blue} shape={(p: any) => <rect x={p.x} y={p.y} width={p.width} height={p.height} rx={3} fill={[C.navy, C.teal, C.purple][p.index]} />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Scenario Comparison" eyebrow="CTR −20% · RRF 15% of Total Assets" action={<Button className="h-8 text-[12.5px]" onClick={() => go('scenario')}>Open simulator</Button>}>
        <Table head={['Metric', 'Baseline', 'CTR Scenario', 'RRF Scenario', 'Change vs Baseline']} align={['l', 'r', 'r', 'r', 'r']} rows={rows.map(([l, g, f, t]) => {
          const b = g(s.base), c = g(s.ctrS), d = g(s.rrfS)
          const df = (x: number) => (t === 'amount' ? sgn(x - b) : l === 'SOA' ? pp(x - b) : l.startsWith('Marginal') ? sgn(x - b, 4) : pp(x - b, 2))
          return [<span className="font-medium">{l}</span>, f(b), f(c), f(d), <span className="inline-flex flex-wrap justify-end gap-1.5"><Delta v={c - b} text={`CTR ${df(c)}`} tone="teal" /><Delta v={d - b} text={`RRF ${df(d)}`} tone="purple" /></span>]
        })} />
        <div className="border-t border-line px-5 py-3 text-[11.5px] text-mute">Direction of change is shown neutrally; whether a change is favourable depends on the company's financing objectives.</div>
      </Card>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-[220px_1fr]">
          <div className="flex flex-col justify-between bg-navy p-6 text-white">
            <Lightbulb size={22} className="text-[#5eead4]" />
            <div><div className="font-mono text-[10.5px] tracking-[0.14em] text-[#8fa6bf] uppercase">Decision support</div><div className="mt-1 font-serif text-[22px] font-semibold">Management Insight</div></div>
          </div>
          <div className="p-6">
            <p className="font-serif text-[18px] leading-relaxed text-ink">The company is currently {below ? 'below' : 'above'} its estimated target leverage. Climate transition exposure is associated with a lower estimated adjustment speed. Internal reserves provide additional financial flexibility under alternative transition-risk scenarios.</p>
            <p className="mt-3 text-[12.5px] text-mute italic">Model-based estimate. This result should support, not replace, management judgment.</p>
            <div className="mt-5 flex flex-wrap gap-2"><Button v="primary" onClick={() => go('scenario')}>Explore Scenarios<ArrowRight size={15} /></Button><Button onClick={() => go('analysis', 'Model Coefficients')}><BookOpen size={15} />Inspect Technology Model</Button></div>
          </div>
        </div>
      </Card>
    </div>
  )
}
