import type { ReactNode } from 'react'
export const C = { navy: '#171717', blue: '#404040', teal: '#737373', green: '#525252', purple: '#a8a29e', grid: '#e7e5e4', axis: '#78716c' }
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
