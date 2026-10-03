import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, ChevronDown, Info, Lock, X, XCircle, CheckCircle2 } from 'lucide-react'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function Card({ children, className, title, action, eyebrow }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode; eyebrow?: string }) {
  return (
    <section className={cx('border border-line bg-white', className)}>
      {title && (
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            {eyebrow && <div className="mb-1 font-mono text-[10.5px] tracking-[0.12em] text-mute uppercase">{eyebrow}</div>}
            <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

type BtnV = 'primary' | 'secondary' | 'ghost' | 'navy'
export function Button({ v = 'secondary', className, children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { v?: BtnV }) {
  const s: Record<BtnV, string> = {
    primary: 'bg-ink text-white hover:bg-[#303030] border-ink',
    navy: 'bg-navy text-white hover:bg-navy-2 border-navy',
    secondary: 'bg-white text-ink border-line hover:border-[#c9d2dc] hover:bg-[#fbfcfd]',
    ghost: 'border-transparent text-mute hover:text-ink hover:bg-[#eef2f6]',
  }
  return <button {...p} className={cx('inline-flex h-10 items-center justify-center gap-2 border px-4 text-[13.5px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:outline-none disabled:opacity-50', s[v], className)}>{children}</button>
}

type Tone = 'neutral' | 'blue' | 'teal' | 'green' | 'purple' | 'amber' | 'red' | 'navy'
const TONES: Record<Tone, string> = {
  neutral: 'bg-[#f5f5f4] text-[#525252] border-[#d6d3d1]', blue: 'bg-[#f5f5f4] text-[#262626] border-[#d6d3d1]',
  teal: 'bg-[#f5f5f4] text-[#404040] border-[#d6d3d1]', green: 'bg-[#f5f5f4] text-[#404040] border-[#d6d3d1]',
  purple: 'bg-[#f5f5f4] text-[#525252] border-[#d6d3d1]', amber: 'bg-[#fafaf9] text-[#404040] border-[#d6d3d1]',
  red: 'bg-[#fafaf9] text-[#262626] border-[#a8a29e]', navy: 'bg-navy text-white border-navy',
}
export function Badge({ tone = 'neutral', children, icon }: { tone?: Tone; children: ReactNode; icon?: ReactNode }) {
  return <span className={cx('inline-flex items-center gap-1 border px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap', TONES[tone])}>{icon}{children}</span>
}
export const Fixed = () => <Badge tone="neutral" icon={<Lock size={11} />}>Fixed</Badge>

export function Tip({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <span className="group relative inline-flex align-middle">
      {children ?? <Info size={13} className="text-[#94a3b8] hover:text-mute" />}
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[240px] -translate-x-1/2 border border-[#404040] bg-navy px-2.5 py-1.5 text-[11.5px] leading-snug font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">{text}</span>
    </span>
  )
}

export function Banner({ tone = 'info', title, children, action }: { tone?: 'info' | 'warn' | 'error' | 'success'; title?: ReactNode; children?: ReactNode; action?: ReactNode }) {
  const m = {
    info: ['border-[#d6d3d1] bg-[#fafaf9]', <Info size={16} className="text-[#525252]" />],
    warn: ['border-[#a8a29e] bg-[#fafaf9]', <AlertTriangle size={16} className="text-[#404040]" />],
    error: ['border-[#78716c] bg-[#fafaf9]', <XCircle size={16} className="text-[#262626]" />],
    success: ['border-[#d6d3d1] bg-[#f5f5f4]', <CheckCircle2 size={16} className="text-[#404040]" />],
  } as const
  return (
    <div className={cx('flex items-start gap-3 border px-4 py-3 text-[13px]', m[tone][0])}>
      <span className="mt-0.5 shrink-0">{m[tone][1]}</span>
      <div className="flex-1 text-[#334155]">{title && <div className="font-semibold text-ink">{title}</div>}{children}</div>
      {action}
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange, size = 'md', labels }: { tabs: readonly T[]; value: T; onChange: (t: T) => void; size?: 'sm' | 'md'; labels?: Partial<Record<T, string>> }) {
  if (size === 'sm')
    return (
      <div className="inline-flex border border-line bg-[#f5f5f4] p-0.5">
        {tabs.map((t) => <button key={t} onClick={() => onChange(t)} className={cx('h-7 px-2.5 text-[12px] font-medium transition', value === t ? 'bg-white text-ink shadow-sm' : 'text-mute hover:text-ink')}>{labels?.[t] ?? t}</button>)}
      </div>
    )
  return (
    <div className="scroll-thin -mx-1 flex gap-1 overflow-x-auto border-b border-line px-1">
      {tabs.map((t, n) => (
        <button key={t} onClick={() => onChange(t)} className={cx('relative flex h-11 shrink-0 items-center gap-2 px-3 text-[13.5px] font-medium transition-colors', value === t ? 'text-ink' : 'text-mute hover:text-ink')}>
          <span className="font-mono text-[10.5px] text-[#94a3b8]">{String(n + 1).padStart(2, '0')}</span>{labels?.[t] ?? t}
          {value === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-navy" />}
        </button>
      ))}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0b2a4a]/40 p-4" onClick={onClose}>
      <div role="dialog" onClick={(e) => e.stopPropagation()} className={cx('flex max-h-[90vh] w-full flex-col border border-line bg-white shadow-2xl', wide ? 'max-w-3xl' : 'max-w-lg')}>
        <header className="flex items-center justify-between border-b border-line px-6 py-4"><h2 className="font-serif text-[20px] font-semibold text-ink">{title}</h2><button onClick={onClose} className="rounded-md p-1.5 text-mute hover:bg-[#eef2f6]"><X size={18} /></button></header>
        <div className="scroll-thin overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</footer>}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  return (
    <div className={cx('fixed inset-0 z-[70] transition', open ? 'visible' : 'invisible')}>
      <div onClick={onClose} className={cx('absolute inset-0 bg-[#0b2a4a]/30 transition-opacity', open ? 'opacity-100' : 'opacity-0')} />
      <aside className={cx('absolute top-0 right-0 flex h-full w-full max-w-[760px] flex-col bg-white shadow-2xl transition-transform duration-300', open ? 'translate-x-0' : 'translate-x-full')}>
        <header className="flex items-center justify-between border-b border-line px-6 py-4"><h2 className="font-serif text-[20px] font-semibold">{title}</h2><button onClick={onClose} className="rounded-md p-1.5 text-mute hover:bg-[#eef2f6]"><X size={18} /></button></header>
        <div className="scroll-thin flex-1 overflow-y-auto p-6">{children}</div>
      </aside>
    </div>
  )
}

export function Dropdown({ trigger, children, align = 'right' }: { trigger: (open: boolean) => ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right' }) {
  const [o, setO] = useState(false)
  const r = useRef<HTMLDivElement>(null)
  useEffect(() => { const h = (e: MouseEvent) => r.current && !r.current.contains(e.target as Node) && setO(false); document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
  return (
    <div ref={r} className="relative">
      <div onClick={() => setO(!o)}>{trigger(o)}</div>
      {o && <div className={cx('absolute top-full z-[60] mt-2 min-w-[220px] border border-line bg-white p-1 shadow-xl', align === 'right' ? 'right-0' : 'left-0')}>{children(() => setO(false))}</div>}
    </div>
  )
}

export function Select({ value, options, onChange, className, label }: { value: string; options: string[]; onChange: (v: string) => void; className?: string; label?: string }) {
  return (
    <label className={cx('relative block', className)}>
      {label && <span className="mb-1.5 block text-[12.5px] font-medium text-[#334155]">{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full appearance-none border border-line bg-white pr-9 pl-3 text-[13.5px] text-ink outline-none hover:border-[#a8a29e] focus:border-ink focus:ring-2 focus:ring-ink/10">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 bottom-3.5 text-mute" />
    </label>
  )
}

export function NumericInput({ label, unit, value, onChange, error, required, info, readOnly, compact }: { label?: string; unit?: string; value: number | null; onChange?: (v: number | null) => void; error?: string; required?: boolean; info?: string; readOnly?: boolean; compact?: boolean }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-[#334155]">{label}{required && <span className="text-[#dc2626]">*</span>}{info && <Tip text={info} />}</span>}
      <span className={cx('flex items-center border bg-white transition', compact ? 'h-9' : 'h-11', error ? 'border-[#737373] ring-2 ring-[#d6d3d1]/60' : 'border-line hover:border-[#a8a29e] focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/10', readOnly && 'bg-[#f5f5f4]')}>
        <input type="number" readOnly={readOnly} value={value ?? ''} placeholder="—" onChange={(e) => onChange?.(e.target.value === '' ? null : Number(e.target.value))} className="tnum h-full w-full min-w-0 bg-transparent px-3 text-right font-mono text-[13px] text-ink outline-none" />
        {unit && <span className="shrink-0 border-l border-line px-2.5 text-[11.5px] text-mute">{unit}</span>}
      </span>
      {error && <span className="mt-1.5 flex items-start gap-1 text-[12px] text-[#b91c1c]"><AlertTriangle size={12} className="mt-0.5 shrink-0" />{error}</span>}
    </label>
  )
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className={cx('relative h-6 w-11 rounded-full transition-colors', on ? 'bg-teal' : 'bg-[#cbd5e1]')}><span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} /></button>
}

export function Accordion({ title, children, meta, defaultOpen }: { title: ReactNode; children: ReactNode; meta?: ReactNode; defaultOpen?: boolean }) {
  const [o, setO] = useState(!!defaultOpen)
  return (
    <div className="border-b border-line last:border-0">
      <button onClick={() => setO(!o)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[#fafbfc]">
        <span className="flex items-center gap-3 text-[14px] font-semibold text-ink">{title}</span>
        <span className="flex items-center gap-3">{meta}<ChevronDown size={16} className={cx('text-mute transition-transform', o && 'rotate-180')} /></span>
      </button>
      {o && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

export function Table({ head, rows, align, dense }: { head: ReactNode[]; rows: ReactNode[][]; align?: ('l' | 'r')[]; dense?: boolean }) {
  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-[13px]">
        <thead><tr>{head.map((h, i) => <th key={i} className={cx('border-b border-line bg-[#fafbfc] px-5 py-2.5 font-mono text-[10.5px] font-medium tracking-[0.08em] text-mute uppercase', align?.[i] === 'r' ? 'text-right' : 'text-left')}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-[#f0f2f5] last:border-0 hover:bg-[#fafcfe]">{r.map((c, j) => <td key={j} className={cx('px-5 text-ink', dense ? 'py-2' : 'py-3', align?.[j] === 'r' && 'tnum text-right font-mono text-[12.5px]')}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

export function Stat({ label, value, sub, info }: { label: string; value: ReactNode; sub?: ReactNode; info?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-1.5 text-[12.5px] text-mute">{label}{info && <Tip text={info} />}</div>
      <div className="tnum mt-2 text-[26px] leading-none font-semibold tracking-tight text-ink">{value}</div>
      {sub && <div className="mt-2 text-[12px] text-mute">{sub}</div>}
    </Card>
  )
}

export const Skeleton = ({ className, style }: { className?: string; style?: React.CSSProperties }) => <div style={style} className={cx('animate-pulse bg-[#e7e5e4]', className)} />

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center border border-line bg-[#f5f5f4] text-navy">{icon}</div>
      <div className="font-serif text-[19px] font-semibold text-ink">{title}</div>
      <p className="mt-1 max-w-sm text-[13.5px] text-mute">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function PageHead({ n, title, sub, actions }: { n: string; title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-2 font-mono text-[11px] tracking-[0.14em] text-teal uppercase">§ {n}</div>
        <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-ink">{title}</h1>
        {sub && <p className="mt-1.5 max-w-2xl text-[14px] text-mute">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export const Delta = ({ v, text, tone }: { v: number; text: string; tone?: Tone }) => <Badge tone={tone ?? (Math.abs(v) < 1e-9 ? 'neutral' : 'blue')}>{Math.abs(v) < 1e-9 ? '—' : v > 0 ? '▲' : '▼'} {text}</Badge>
