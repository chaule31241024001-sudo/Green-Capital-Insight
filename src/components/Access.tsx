import { useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, BarChart3, Building2, Check, LayoutDashboard, LockKeyhole, LogOut, Plus, Search, ShieldCheck, SlidersHorizontal, TrendingUp } from 'lucide-react'
import { INDUSTRIES } from '../model'
import type { CompanyProfile, InternalUser } from '../store'
import { tr, type Language } from '../i18n'
import { Button, cx } from './ui'

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center bg-white text-navy"><BarChart3 size={22} /></span>
      <div><div className="text-[13px] font-bold tracking-[0.1em] text-white">GREEN CAPITAL INSIGHT</div><div className="text-[11px] text-[#a8a29e]">Internal decision platform</div></div>
    </div>
  )
}

function LockedDashboard() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#f5f5f4] text-ink">
      <aside className="absolute inset-y-0 left-0 hidden w-[248px] bg-navy px-5 py-6 text-white md:block">
        <Brand />
        <div className="mt-10 font-mono text-[9px] tracking-[0.15em] text-[#78716c] uppercase">Workspace</div>
        <div className="mt-3 flex items-center gap-3 border-l-2 border-white bg-white/10 px-3 py-3 text-[12px] font-semibold"><LayoutDashboard size={16} />Dashboard</div>
        <div className="mt-8 font-mono text-[9px] tracking-[0.15em] text-[#78716c] uppercase">Core functions</div>
        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-3 text-[12px] text-[#d6d3d1]"><BarChart3 size={16} /><span className="flex-1">Capital Analysis</span><span className="font-mono text-[10px] text-[#78716c]">01</span></div>
          <div className="flex items-center gap-3 px-3 py-3 text-[12px] text-[#d6d3d1]"><SlidersHorizontal size={16} /><span className="flex-1">Scenario Simulation</span><span className="font-mono text-[10px] text-[#78716c]">02</span></div>
        </div>
        <div className="absolute right-5 bottom-6 left-5 border border-white/10 bg-white/[0.03] p-4">
          <div className="font-mono text-[9px] tracking-[0.12em] text-[#78716c] uppercase">Technology</div>
          <div className="mt-2 text-[11.5px] font-medium">FEM + System GMM</div>
          <div className="mt-1 text-[10.5px] text-[#78716c]">Model GMM 2026 V1</div>
        </div>
      </aside>

      <div className="md:ml-[248px]">
        <header className="flex h-16 items-center justify-between border-b border-line bg-white px-5 sm:px-8">
          <div><div className="text-[14px] font-semibold">Dashboard</div><div className="text-[10.5px] text-mute">Internal capital decision workspace</div></div>
          <div className="flex items-center gap-2"><span className="hidden border border-line bg-[#fafaf9] px-3 py-2 text-[11px] text-mute sm:block">Company not selected</span><span className="border border-line bg-[#fafaf9] px-3 py-2 font-mono text-[11px] text-mute">Year —</span></div>
        </header>
        <main className="mx-auto max-w-[1320px] p-5 sm:p-8">
          <div className="mb-7 flex items-end justify-between gap-5">
            <div><div className="font-mono text-[9.5px] tracking-[0.14em] text-mute uppercase">Executive overview</div><h1 className="mt-2 text-[28px] font-semibold tracking-tight">Capital &amp; climate risk dashboard</h1><p className="mt-1 text-[12px] text-mute">Select your company and reporting year to start an analysis.</p></div>
            <div className="hidden bg-navy px-4 py-2.5 text-[11.5px] font-medium text-white lg:block">New analysis</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Target leverage', '—', 'FEM estimate'],
              ['Expected leverage', '—', 'System GMM'],
              ['Climate risk', '—', 'CTR exposure'],
              ['Adjustment speed', '—', 'Model output'],
            ].map(([label, value, note]) => <div key={label} className="border border-line bg-white p-5"><div className="text-[11.5px] text-mute">{label}</div><div className="mt-4 font-mono text-[25px] font-semibold">{value}</div><div className="mt-2 text-[10.5px] text-mute">{note}</div></div>)}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_0.8fr]">
            <div className="border border-line bg-white p-5">
              <div className="flex items-center justify-between"><div><div className="text-[13px] font-semibold">Leverage position</div><div className="mt-1 text-[10.5px] text-mute">Actual, target and expected capital structure</div></div><TrendingUp size={17} className="text-mute" /></div>
              <div className="mt-8 flex h-[190px] items-end gap-[7%] border-b border-l border-line px-[7%]">
                {[32, 52, 43, 66, 58, 76, 63].map((height, index) => <div key={index} className="flex-1 bg-[#d6d3d1]" style={{ height: `${height}%` }} />)}
              </div>
            </div>
            <div className="border border-line bg-white p-5">
              <div className="text-[13px] font-semibold">Model readiness</div><div className="mt-1 text-[10.5px] text-mute">Required context and inputs</div>
              <div className="mt-7 space-y-5">{['Company profile', 'Analysis year', 'Financial inputs', 'Fuel mix & RRF'].map((item, index) => <div key={item}><div className="flex justify-between text-[11px]"><span>{item}</span><span className="font-mono text-mute">{index < 2 ? 'Required' : 'Pending'}</span></div><div className="mt-2 h-1.5 bg-[#e7e5e4]"><div className="h-full bg-[#a8a29e]" style={{ width: `${index < 2 ? 28 : 12}%` }} /></div></div>)}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export function LoginScreen({ language, onLanguageChange, onSignIn }: { language: Language; onLanguageChange: (language: Language) => void; onSignIn: (user: InternalUser) => void }) {
  const t = (text: string) => tr(language, text)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!email.includes('@')) return setError(t('Enter a valid company email address.'))
    if (password.length < 6) return setError(t('Password must contain at least 6 characters.'))
    onSignIn({ name: name.trim() || email.split('@')[0], email: email.trim(), role: 'Internal Analyst' })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f5f4]">
      <LockedDashboard />
      <div className="absolute inset-0 z-10 bg-navy/35 backdrop-blur-[2px]" />
      <section className="hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        <div className="relative"><Brand /></div>
        <div className="relative my-auto max-w-xl">
          <div className="font-mono text-[11px] tracking-[0.16em] text-[#a8a29e] uppercase">Private workspace · Model governed</div>
          <h1 className="mt-5 text-[48px] leading-[1.08] font-semibold tracking-tight">Climate risk and capital decisions, in one internal workspace.</h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[#d6d3d1]">A focused platform for finance teams to calculate target leverage and test transition-risk scenarios with an auditable model.</p>
          <div className="mt-10 grid grid-cols-2 gap-3">
            <div className="border border-white/15 bg-white/[0.04] p-4"><BarChart3 size={18} /><div className="mt-8 text-[13px] font-semibold">01 · Capital analysis</div><div className="mt-1 text-[12px] text-[#a8a29e]">FEM target leverage and full System GMM outputs.</div></div>
            <div className="border border-white/15 bg-white/[0.04] p-4"><SlidersHorizontal size={18} /><div className="mt-8 text-[13px] font-semibold">02 · Scenario simulation</div><div className="mt-1 text-[12px] text-[#a8a29e]">Realtime CTR and internal-reserve assumptions.</div></div>
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-[11.5px] text-[#a8a29e]"><ShieldCheck size={14} />Internal access only · Model version GMM 2026 V1</div>
      </section>

      <section className="relative z-20 flex min-h-screen items-center justify-center px-4 py-8 sm:justify-end sm:px-10 lg:px-[8vw]">
        <form onSubmit={submit} className="w-full max-w-[430px] border border-line bg-white p-7 shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:p-10">
          <div className="mb-8 flex items-center justify-between"><div className="inline-flex bg-navy p-3 text-white"><BarChart3 size={22} /></div><div className="flex border border-line p-0.5 text-[11px]"><button type="button" onClick={() => onLanguageChange('en')} className={cx('px-2.5 py-1.5', language === 'en' && 'bg-navy text-white')}>EN</button><button type="button" onClick={() => onLanguageChange('vi')} className={cx('px-2.5 py-1.5', language === 'vi' && 'bg-navy text-white')}>VI</button></div></div>
          <div className="font-mono text-[10.5px] tracking-[0.14em] text-mute uppercase">{t('Internal access')}</div>
          <h2 className="mt-2 text-[30px] font-semibold tracking-tight">{t('Sign in to your workspace')}</h2>
          <p className="mt-2 text-[13.5px] text-mute">{t('Use your company account to continue to company setup.')}</p>
          <div className="mt-7 space-y-4">
            <label className="block text-[12.5px] font-medium">{t('Full name')}<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyen Van An" className="mt-1.5 h-11 w-full border border-line px-3 text-[13.5px] outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
            <label className="block text-[12.5px] font-medium">{t('Company email')}<input autoFocus type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} placeholder="you@company.vn" className="mt-1.5 h-11 w-full border border-line px-3 text-[13.5px] outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
            <label className="block text-[12.5px] font-medium">{t('Password')}<input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} placeholder={t('Minimum 6 characters')} className="mt-1.5 h-11 w-full border border-line px-3 text-[13.5px] outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
          </div>
          {error && <div className="mt-4 border border-[#a8a29e] bg-[#fafaf9] px-3 py-2 text-[12.5px] text-[#991b1b]">{error}</div>}
          <Button type="submit" v="primary" className="mt-6 w-full">{t('Continue to company setup')}<ArrowRight size={15} /></Button>
          <div className="mt-5 flex items-center justify-center gap-2 text-[11.5px] text-mute"><LockKeyhole size={13} />{t('Credentials stay in this prototype session.')}</div>
        </form>
      </section>
    </div>
  )
}

export function CompanySetup({
  language,
  onLanguageChange,
  user,
  companies,
  activeCompanyId,
  initialYear,
  onAddCompany,
  onContinue,
  onClose,
  onSignOut,
}: {
  language: Language
  onLanguageChange: (language: Language) => void
  user: InternalUser
  companies: CompanyProfile[]
  activeCompanyId?: string
  initialYear: number
  onAddCompany: (company: Omit<CompanyProfile, 'id'>) => CompanyProfile
  onContinue: (companyId: string, year: number) => void
  onClose?: () => void
  onSignOut: () => void
}) {
  const t = (text: string) => tr(language, text)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(activeCompanyId || companies[0]?.id || '')
  const [year, setYear] = useState(Math.max(1900, Math.min(2030, initialYear)))
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ name: '', industry: Object.keys(INDUSTRIES)[0], code: '', country: 'Vietnam' })
  const [error, setError] = useState('')
  const filtered = useMemo(() => companies.filter((company) => `${company.name} ${company.code}`.toLowerCase().includes(query.toLowerCase())), [companies, query])
  const selectedCompany = companies.find((company) => company.id === selected)

  const add = () => {
    if (!draft.name.trim()) return setError(t('Company name is required.'))
    const company = onAddCompany({ ...draft, name: draft.name.trim(), code: draft.code.trim().toUpperCase() })
    setSelected(company.id); setAdding(false); setQuery(''); setError('')
    setDraft({ name: '', industry: Object.keys(INDUSTRIES)[0], code: '', country: 'Vietnam' })
  }

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/10 bg-navy px-5 text-white sm:px-8"><Brand /><div className="flex items-center gap-2 text-[12px]"><div className="flex border border-white/20 p-0.5"><button onClick={() => onLanguageChange('en')} className={cx('px-2 py-1', language === 'en' && 'bg-white text-navy')}>EN</button><button onClick={() => onLanguageChange('vi')} className={cx('px-2 py-1', language === 'vi' && 'bg-white text-navy')}>VI</button></div><span className="hidden text-[#a8a29e] sm:inline">{user.email}</span>{onClose && <button onClick={onClose} className="border border-white/20 px-3 py-2 hover:bg-white/10">{t('Cancel')}</button>}<button onClick={onSignOut} className="flex items-center gap-1.5 border border-white/20 px-3 py-2 hover:bg-white/10"><LogOut size={13} />{t('Sign out')}</button></div></header>
      <main className="mx-auto grid max-w-[1180px] gap-6 px-4 py-8 lg:grid-cols-[250px_1fr] lg:py-12">
        <aside className="border border-line bg-white p-5 lg:min-h-[610px]">
          <div className="font-mono text-[10.5px] tracking-[0.12em] text-mute uppercase">{t('Workspace setup')}</div>
          <div className="mt-7 space-y-6">
            <div className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center bg-navy font-mono text-[11px] text-white">01</span><div><div className="text-[13px] font-semibold">{t('Company')}</div><div className="text-[11.5px] text-mute">{t('Find or create an entity')}</div></div></div>
            <div className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center border border-ink font-mono text-[11px]">02</span><div><div className="text-[13px] font-semibold">{t('Analysis year')}</div><div className="text-[11.5px] text-mute">{t('Select reporting period')}</div></div></div>
            <div className="flex gap-3 opacity-60"><span className="grid h-7 w-7 shrink-0 place-items-center border border-line font-mono text-[11px]">03</span><div><div className="text-[13px] font-semibold">{t('Dashboard')}</div><div className="text-[11.5px] text-mute">{t('Open internal workspace')}</div></div></div>
          </div>
          <div className="mt-10 border-t border-line pt-4 text-[11.5px] leading-relaxed text-mute">The selected analysis year is <b>t</b>. Model inputs must use the consistent historical period <b>t−1</b>.</div>
        </aside>

        <section className="border border-line bg-white">
          <div className="border-b border-line px-6 py-5 sm:px-8"><div className="font-mono text-[10.5px] tracking-[0.12em] text-mute uppercase">Internal workspace</div><h1 className="mt-1 text-[26px] font-semibold">{t('Set up your company context')}</h1><p className="mt-1 text-[13px] text-mute">{t('Choose the company and reporting year used across both core modules.')}</p></div>
          <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-3 flex items-center justify-between"><h2 className="text-[14px] font-semibold">{t('Company directory')}</h2><button onClick={() => setAdding(!adding)} className="flex items-center gap-1 text-[12.5px] font-medium hover:underline"><Plus size={14} />{t('Add company')}</button></div>
              {adding ? (
                <div className="space-y-3 border border-ink bg-[#fafaf9] p-4">
                  <div className="grid gap-3 sm:grid-cols-2"><label className="text-[12px] font-medium">{t('Company name')}<input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1 h-10 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink" /></label><label className="text-[12px] font-medium">{t('Company code')}<input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder={t('Optional')} className="mt-1 h-10 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink" /></label></div>
                  <label className="block text-[12px] font-medium">{t('Industry')}<select value={draft.industry} onChange={(e) => setDraft({ ...draft, industry: e.target.value })} className="mt-1 h-10 w-full border border-line bg-white px-3 text-[13px] outline-none focus:border-ink">{Object.keys(INDUSTRIES).map((industry) => <option key={industry}>{industry}</option>)}</select></label>
                  {error && <div className="text-[12px] text-[#991b1b]">{error}</div>}
                  <div className="flex justify-end gap-2"><Button className="h-9" onClick={() => { setAdding(false); setError('') }}>{t('Cancel')}</Button><Button className="h-9" v="primary" onClick={add}>{t('Add to directory')}</Button></div>
                </div>
              ) : (
                <>
                  <label className="flex h-11 items-center gap-2 border border-line px-3 focus-within:border-ink"><Search size={15} className="text-mute" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Search company name or code…')} className="min-w-0 flex-1 text-[13px] outline-none" /></label>
                  <div className="scroll-thin mt-3 max-h-[286px] overflow-y-auto border border-line">
                    {filtered.map((company) => <button key={company.id} onClick={() => setSelected(company.id)} className={cx('flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-[#fafaf9]', selected === company.id && 'bg-[#f5f5f4]')}><span className={cx('grid h-8 w-8 shrink-0 place-items-center border', selected === company.id ? 'border-navy bg-navy text-white' : 'border-line')}><Building2 size={15} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{company.name}</span><span className="block truncate text-[11.5px] text-mute">{company.code || 'No code'} · {company.industry}</span></span>{selected === company.id && <Check size={16} />}</button>)}
                    {!filtered.length && <div className="px-4 py-10 text-center text-[13px] text-mute">{t('No company found. Add it to the directory.')}</div>}
                  </div>
                </>
              )}
            </div>

            <div>
              <h2 className="text-[14px] font-semibold">{t('Analysis year')}</h2>
              <div className="mt-3 border border-line bg-[#fafaf9] p-5">
                <div className="flex items-end justify-between"><div><div className="text-[11.5px] text-mute">{t('Selected year (t)')}</div><div className="tnum mt-1 font-mono text-[34px] font-semibold">{year}</div></div><div className="text-right"><div className="text-[11.5px] text-mute">{t('Model input period')}</div><div className="tnum mt-1 font-mono text-[16px] font-medium">FY{year - 1}</div></div></div>
                <input aria-label="Analysis year" type="range" min={1900} max={2030} step={1} value={year} onChange={(e) => setYear(Number(e.target.value))} className="mt-7 w-full" />
                <div className="mt-2 flex justify-between font-mono text-[10.5px] text-mute"><span>1900</span><span>1965</span><span>2030</span></div>
                <label className="mt-5 block text-[12px] font-medium">{t('Enter exact year')}<input type="number" min={1900} max={2030} value={year} onChange={(e) => setYear(Math.max(1900, Math.min(2030, Number(e.target.value))))} className="tnum mt-1 h-10 w-full border border-line bg-white px-3 font-mono text-[13px] outline-none focus:border-ink" /></label>
              </div>
              <div className="mt-3 text-[11.5px] leading-relaxed text-mute">The year selector supports 1900–2030. Analysis will only run when company, industry and macro data exist for FY{year - 1}.</div>
            </div>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-[#fafaf9] px-6 py-4 sm:px-8"><div className="text-[12px] text-mute">{selectedCompany ? <><b className="text-ink">{selectedCompany.name}</b> · {t('Analysis year')} {year}</> : t('Select a company to continue')}</div><Button v="primary" disabled={!selectedCompany} onClick={() => selectedCompany && onContinue(selectedCompany.id, year)}>{t('Open Dashboard')}<ArrowRight size={15} /></Button></footer>
        </section>
      </main>
    </div>
  )
}
