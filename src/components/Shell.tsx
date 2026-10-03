import { useState, type ReactNode } from 'react'
import { BarChart3, Bell, Building2, CalendarRange, ChevronDown, ChevronsLeft, ChevronsRight, Database, LayoutDashboard, LineChart, LogOut, Menu, Plus, Search, Settings2, SlidersHorizontal, X } from 'lucide-react'
import { useApp, type Page } from '../store'
import { MODEL_VERSION } from '../model'
import { cx, Dropdown } from './ui'

const NAV: { p: Page; label: string; icon: typeof LineChart; n: string }[] = [
  { p: 'analysis', label: 'Capital Analysis', icon: LineChart, n: '01' },
  { p: 'scenario', label: 'Scenario Simulation', icon: SlidersHorizontal, n: '02' },
]
const TITLES: Record<Page, [string, string?]> = {
  overview: ['Dashboard'],
  data: ['Analysis Data', 'Capital Analysis'],
  analysis: ['Capital Analysis'],
  scenario: ['Scenario Simulation'],
}

function Mark() {
  return <span className="grid h-8 w-8 place-items-center bg-white text-navy"><BarChart3 size={19} /></span>
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'
}

function Sidebar({ collapsed, onNav }: { collapsed: boolean; onNav?: () => void }) {
  const { page, go, user } = useApp()
  const active = page === 'data' ? 'analysis' : page
  return (
    <div className="flex h-full flex-col bg-navy text-[#d6d3d1]">
      <div className={cx('flex items-center gap-3 border-b border-white/10 py-5', collapsed ? 'justify-center px-2' : 'px-5')}>
        <Mark />
        {!collapsed && <div className="leading-tight"><div className="text-[13px] font-bold tracking-[0.08em] text-white">GREEN CAPITAL INSIGHT</div><div className="mt-0.5 text-[11px] text-[#a8a29e]">Internal Decision Platform</div></div>}
      </div>
      <nav className="flex-1 p-3">
        <button title="Dashboard" onClick={() => { go('overview'); onNav?.() }} className={cx('flex h-10 w-full items-center gap-3 text-[13.5px] transition-colors', collapsed ? 'justify-center' : 'px-3', active === 'overview' ? 'bg-white text-black' : 'hover:bg-white/[0.08] hover:text-white')}><LayoutDashboard size={17} strokeWidth={1.6} />{!collapsed && <span className="flex-1 text-left">Dashboard</span>}</button>
        {!collapsed && <div className="mt-6 mb-2 px-3 font-mono text-[9.5px] tracking-[0.14em] text-[#737373] uppercase">Core functions</div>}
        <div className={cx('space-y-0.5', collapsed && 'mt-4')}>
          {NAV.map(({ p, label, icon: Icon, n }) => <button key={p} title={label} onClick={() => { go(p); onNav?.() }} className={cx('group flex h-10 w-full items-center gap-3 text-[13.5px] transition-colors', collapsed ? 'justify-center' : 'px-3', active === p ? 'bg-white text-black' : 'hover:bg-white/[0.08] hover:text-white')}><Icon size={17} strokeWidth={1.6} />{!collapsed && <><span className="flex-1 text-left">{label}</span><span className="font-mono text-[10px] text-[#737373]">{n}</span></>}</button>)}
        </div>
        <button title="Input analysis data" onClick={() => { go('data'); onNav?.() }} className={cx('mt-4 flex h-10 w-full items-center gap-3 border border-dashed border-white/20 text-[13px] hover:border-white/50 hover:text-white', collapsed ? 'justify-center' : 'px-3', page === 'data' && 'border-solid border-white bg-white text-black')}><Database size={16} strokeWidth={1.6} />{!collapsed && 'Input Analysis Data'}</button>
      </nav>
      <div className="space-y-2 border-t border-white/10 p-3">
        {!collapsed ? <div className="border border-white/10 bg-white/[0.04] p-3"><div className="flex items-center justify-between"><span className="font-mono text-[9.5px] tracking-[0.12em] text-[#a8a29e] uppercase">Technology model</span><span className="h-2 w-2 rounded-full bg-white" /></div><div className="mt-1 font-mono text-[10px] break-all text-white">{MODEL_VERSION}</div></div> : <div className="flex justify-center py-2" title={MODEL_VERSION}><span className="h-2 w-2 rounded-full bg-white" /></div>}
        <div className={cx('flex items-center gap-3 py-2', collapsed ? 'justify-center' : 'px-2')}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#404040] text-[11px] font-semibold text-white">{initials(user.name)}</span>{!collapsed && <span className="min-w-0 leading-tight"><span className="block truncate text-[12.5px] text-white">{user.name}</span><span className="block truncate text-[10.5px] text-[#a8a29e]">{user.role}</span></span>}</div>
      </div>
    </div>
  )
}

export default function Shell({ children }: { children: ReactNode }) {
  const { page, go, inputs, setInputs, updated, user, openCompanySetup, signOut } = useApp()
  const [collapsed, setCollapsed] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [title, crumb] = TITLES[page]
  return (
    <div className="min-h-screen" style={{ ['--sb' as string]: collapsed ? '72px' : '264px' }}>
      <aside className={cx('fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 md:block', collapsed ? 'w-[72px]' : 'w-[264px]')}><Sidebar collapsed={collapsed} /><button onClick={() => setCollapsed(!collapsed)} className="absolute top-7 -right-3 grid h-6 w-6 place-items-center rounded-full border border-line bg-white text-mute shadow hover:text-ink" aria-label="Collapse sidebar">{collapsed ? <ChevronsRight size={13} /> : <ChevronsLeft size={13} />}</button></aside>
      {mobile && <div className="fixed inset-0 z-[75] md:hidden"><div className="absolute inset-0 bg-black/40" onClick={() => setMobile(false)} /><div className="absolute inset-y-0 left-0 w-[280px]"><Sidebar collapsed={false} onNav={() => setMobile(false)} /></div><button onClick={() => setMobile(false)} className="absolute top-4 left-[292px] rounded-full bg-white p-2"><X size={16} /></button></div>}

      <div className={cx('transition-[padding] duration-200', collapsed ? 'md:pl-[72px]' : 'md:pl-[264px]')}>
        <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
            <button className="rounded-md p-2 md:hidden" onClick={() => setMobile(true)} aria-label="Menu"><Menu size={20} /></button>
            <div className="min-w-0 flex-1">{crumb && <div className="text-[11px] text-mute"><button onClick={() => go('analysis')} className="hover:text-ink">{crumb}</button><span className="mx-1">/</span>{title}</div>}<div className="truncate text-[15px] font-semibold">{title}</div></div>

            <div className="hidden items-center gap-2 lg:flex">
              <Dropdown align="left" trigger={(open) => <button className={cx('flex h-10 max-w-[240px] items-center gap-2 border px-3 text-[13px]', open ? 'border-ink' : 'border-line hover:border-[#a8a29e]')}><Building2 size={14} className="shrink-0 text-mute" /><span className="truncate font-medium">{inputs.company}</span><ChevronDown size={14} className="shrink-0 text-mute" /></button>}>{(close) => <CompanyMenu close={close} />}</Dropdown>
              <Dropdown align="left" trigger={(open) => <button className={cx('flex h-10 items-center gap-2 border px-3 text-[13px]', open ? 'border-ink' : 'border-line hover:border-[#a8a29e]')}><CalendarRange size={14} className="text-mute" /><span className="text-mute">Year</span><span className="font-mono font-medium">{inputs.year}</span><ChevronDown size={14} className="text-mute" /></button>}>{(close) => <YearMenu close={close} />}</Dropdown>
            </div>
            <div className="hidden leading-tight xl:block"><div className="text-[10.5px] text-mute">Inputs use <span className="font-mono text-ink">FY{inputs.year - 1}</span></div><div className="text-[10.5px] text-mute">Updated {updated}</div></div>
            <button onClick={() => go('data')} className="hidden h-10 items-center gap-2 bg-navy px-4 text-[13px] font-medium text-white hover:bg-navy-2 sm:flex"><Database size={15} />Input Data</button>
            <button className="relative p-2.5 text-mute hover:bg-[#f1f1f0] hover:text-ink" aria-label="Notifications"><Bell size={18} /><span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-ink" /></button>
            <Dropdown trigger={() => <button className="flex items-center gap-2 p-1 hover:bg-[#f1f1f0]"><span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-[11px] font-semibold text-white">{initials(user.name)}</span><ChevronDown size={14} className="hidden text-mute sm:block" /></button>}>{(close) => <div className="w-[250px]"><div className="border-b border-line px-3 py-3"><div className="text-[13px] font-medium">{user.name}</div><div className="truncate text-[11.5px] text-mute">{user.email}</div></div><button onClick={() => { openCompanySetup(); close() }} className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] hover:bg-[#f5f5f4]"><Settings2 size={14} />Company & year setup</button><button onClick={() => { go('data'); close() }} className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] hover:bg-[#f5f5f4] lg:hidden"><Database size={14} />Input analysis data</button><button onClick={() => { signOut(); close() }} className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-[13px] text-[#991b1b] hover:bg-[#fafaf9]"><LogOut size={14} />Sign out</button></div>}</Dropdown>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">{children}</main>
      </div>
    </div>
  )
}

function CompanyMenu({ close }: { close: () => void }) {
  const { companies, activeCompanyId, selectCompany, inputs, openCompanySetup } = useApp()
  const [query, setQuery] = useState('')
  const filtered = companies.filter((company) => `${company.name} ${company.code}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="w-[310px]"><label className="mb-1 flex h-9 items-center gap-2 border-b border-line px-2"><Search size={14} className="text-mute" /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search company…" className="min-w-0 flex-1 text-[13px] outline-none" /></label><div className="scroll-thin max-h-64 overflow-y-auto">{filtered.map((company) => <button key={company.id} onClick={() => { selectCompany(company.id, inputs.year); close() }} className={cx('flex w-full items-center gap-3 px-3 py-2.5 text-left text-[13px] hover:bg-[#f5f5f4]', company.id === activeCompanyId && 'bg-[#f5f5f4] font-semibold')}><span className="grid h-7 w-7 shrink-0 place-items-center border border-line"><Building2 size={13} /></span><span className="min-w-0 flex-1"><span className="block truncate">{company.name}</span><span className="block font-mono text-[10px] font-normal text-mute">{company.code || 'NO CODE'}</span></span>{company.id === activeCompanyId && <span className="h-1.5 w-1.5 rounded-full bg-ink" />}</button>)}</div><button onClick={() => { openCompanySetup(); close() }} className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-[12.5px] font-medium hover:bg-[#f5f5f4]"><Plus size={14} />Manage company directory</button></div>
}

function YearMenu({ close }: { close: () => void }) {
  const { inputs, setInputs } = useApp()
  const setYear = (year: number) => setInputs({ ...inputs, year: Math.max(1900, Math.min(2030, year)) })
  return <div className="w-[300px] p-4"><div className="flex items-end justify-between"><div><div className="text-[11px] text-mute">Analysis year (t)</div><div className="tnum font-mono text-[28px] font-semibold">{inputs.year}</div></div><div className="text-right text-[11px] text-mute">Input period<div className="font-mono text-[14px] font-medium text-ink">FY{inputs.year - 1}</div></div></div><input aria-label="Analysis year" type="range" min={1900} max={2030} value={inputs.year} onChange={(e) => setYear(Number(e.target.value))} className="mt-5 w-full" /><div className="mt-1 flex justify-between font-mono text-[9.5px] text-mute"><span>1900</span><span>2030</span></div><div className="mt-4 flex gap-2"><input type="number" min={1900} max={2030} value={inputs.year} onChange={(e) => setYear(Number(e.target.value))} className="tnum h-9 min-w-0 flex-1 border border-line px-3 font-mono text-[12px] outline-none focus:border-ink" /><button onClick={close} className="h-9 bg-navy px-4 text-[12px] font-medium text-white">Apply</button></div><div className="mt-3 text-[10.5px] leading-relaxed text-mute">Changing year clears the current analysis. Model validation checks data availability for FY{inputs.year - 1}.</div></div>
}
