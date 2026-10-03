import type { ReactNode } from 'react'
export const C = { navy: '#16382f', blue: '#2f6f5e', teal: '#2f9b73', green: '#2f8f5b', purple: '#7b6a9d', grid: '#dce5da', axis: '#667a70' }
export const axis = { stroke: C.axis, fontSize: 11, tickLine: false, axisLine: false } as const
export function ChartTip({ active, payload, label, f }: { active?: boolean; payload?: any[]; label?: ReactNode; f?: (v: number, k: string) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="border border-line bg-white px-3 py-2 text-[12px] shadow-lg">
      <div className="mb-1 font-mono text-[11px] text-mute">{label}</div>
      {payload.map((p) => <div key={p.dataKey} className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm" style={{ background: p.color || p.fill }} /><span className="text-mute">{p.name}</span><span className="tnum ml-auto pl-4 font-mono font-medium">{f ? f(p.value, p.dataKey) : p.value}</span></div>)}
    </div>
  )
}
