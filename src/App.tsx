import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { AppCtx, type CompanyProfile, type InternalUser, type Page, type Saved } from './store'
import { DEFAULT_INPUTS, analyze, type Inputs, type Result } from './model'
import Shell from './components/Shell'
import { CompanySetup, LoginScreen } from './components/Access'
import { CheckCircle2, Info, Loader2, XCircle } from 'lucide-react'
import type { ExtractedCompanyData } from './companyDataExtractor'
import { tr, type Language } from './i18n'

const Overview = lazy(() => import('./pages/Overview'))
const CompanyData = lazy(() => import('./pages/CompanyData'))
const Analysis = lazy(() => import('./pages/Analysis'))
const Scenario = lazy(() => import('./pages/Scenario'))

const DEFAULT_COMPANIES: CompanyProfile[] = [
  { id: 'abc', name: 'ABC Corporation', industry: 'Construction materials', code: 'ABC', country: 'Vietnam' },
  { id: 'viet-cement', name: 'Viet Cement JSC', industry: 'Construction materials', code: 'VCM', country: 'Vietnam' },
  { id: 'mekong-logistics', name: 'Mekong Logistics Group', industry: 'Transportation & logistics', code: 'MLG', country: 'Vietnam' },
  { id: 'saigon-steel', name: 'Saigon Steel Holdings', industry: 'Steel & metals', code: 'SSH', country: 'Vietnam' },
  { id: 'delta-chemicals', name: 'Delta Chemicals Co.', industry: 'Chemicals', code: 'DCC', country: 'Vietnam' },
]

export default function App() {
  const [page, setPage] = useState<Page>('overview')
  const [sub, setSub] = useState<string>()
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('gci:language') === 'vi' ? 'vi' : 'en')
  const [user, setUser] = useState<InternalUser | null>(() => {
    try { const stored = localStorage.getItem('gci:user'); return stored ? JSON.parse(stored) : null } catch { return null }
  })
  const [companies, setCompanies] = useState<CompanyProfile[]>(() => {
    try { const stored = localStorage.getItem('gci:companies'); return stored ? JSON.parse(stored) : DEFAULT_COMPANIES } catch { return DEFAULT_COMPANIES }
  })
  const [activeCompanyId, setActiveCompanyId] = useState(() => localStorage.getItem('gci:active-company') || '')
  const [setupOpen, setSetupOpen] = useState(false)
  const [inputs, setInputsState] = useState<Inputs>(() => {
    try {
      const draft = localStorage.getItem('gci:draft')
      if (!draft) return DEFAULT_INPUTS
      const parsed = JSON.parse(draft)
      return { ...DEFAULT_INPUTS, ...parsed, fuel: { ...DEFAULT_INPUTS.fuel, ...parsed.fuel } }
    } catch {
      return DEFAULT_INPUTS
    }
  })
  const [result, setResult] = useState<Result | null>(() => {
    try { return analyze(inputs) } catch { return null }
  })
  const setInputs = useCallback((next: Inputs) => {
    setInputsState(next)
    setResult(null)
  }, [])
  const [running, setRunning] = useState(false)
  const [ctrPct, setCtrPct] = useState(0)
  const [rrfS, setRrfS] = useState(10.4)
  const [saved, setSaved] = useState<Saved[]>(() => {
    try {
      const stored = localStorage.getItem('gci:scenarios')
      if (stored) return JSON.parse(stored)
    } catch { /* use seeded scenarios */ }
    return [
      { name: 'Baseline', desc: 'FY2023 inputs, no adjustments', ctr: 0, rrf: 10.4 },
      { name: '20% CTR Reduction', desc: 'Fuel switching programme', ctr: 20, rrf: 10.4 },
      { name: 'High Internal Reserve', desc: 'Retain 2026 earnings', ctr: 0, rrf: 18 },
      { name: 'Transition Stress Case', desc: '35% increase in transition exposure', ctr: -35, rrf: 6 },
    ]
  })
  const [toasts, setToasts] = useState<{ id: number; msg: string; tone: string }[]>([])
  const [updated, setUpdated] = useState(() => new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))

  const toast = useCallback((msg: string, tone: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now()
    setToasts((t) => [...t, { id, msg, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])
  const go = (p: Page, s?: string) => { setPage(p); setSub(s); window.scrollTo({ top: 0 }) }
  const addCompany = useCallback((company: Omit<CompanyProfile, 'id'>) => {
    const created = { ...company, id: crypto.randomUUID() }
    setCompanies((current) => [...current, created])
    return created
  }, [])
  const selectCompany = useCallback((id: string, year = inputs.year) => {
    const company = companies.find((item) => item.id === id)
    if (!company) return
    setActiveCompanyId(id)
    setInputsState((current) => ({ ...current, company: company.name, industry: company.industry, year }))
    setResult(null)
    setCtrPct(0)
    setSetupOpen(false)
    setPage('overview')
    window.scrollTo({ top: 0 })
  }, [companies, inputs.year])
  const importCompanyData = useCallback((data: ExtractedCompanyData) => {
    const importedName = data.inputs.company?.trim()
    if (importedName) {
      const match = companies.find((company) => company.name.toLowerCase() === importedName.toLowerCase() || Boolean(data.companyCode && company.code.toLowerCase() === data.companyCode.toLowerCase()))
      if (match) {
        setActiveCompanyId(match.id)
        setCompanies((current) => current.map((company) => company.id === match.id ? { ...company, industry: data.inputs.industry || company.industry, code: data.companyCode || company.code, country: data.country || company.country } : company))
      } else {
        const created: CompanyProfile = { id: crypto.randomUUID(), name: importedName, industry: data.inputs.industry || inputs.industry, code: data.companyCode || '', country: data.country || 'Vietnam' }
        setCompanies((current) => [...current, created])
        setActiveCompanyId(created.id)
      }
    }
    setInputsState((current) => ({ ...current, ...data.inputs, fuel: { ...current.fuel, ...data.inputs.fuel } }))
    setResult(null)
    setCtrPct(0)
  }, [companies, inputs.industry])
  const signOut = useCallback(() => {
    setUser(null)
    setSetupOpen(false)
    setPage('overview')
    localStorage.removeItem('gci:user')
  }, [])
  const run = async () => {
    setRunning(true)
    await new Promise((r) => setTimeout(r, 600))
    try {
      const next = analyze(inputs)
      setResult(next); setRrfS(+(next.rrf * 100).toFixed(1)); setCtrPct(0)
      setUpdated(new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
      go('overview'); toast('Analysis completed for ' + inputs.company)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to complete analysis.', 'error')
    } finally {
      setRunning(false)
    }
  }
  useEffect(() => { document.title = 'Green Capital Insight' }, [])
  useEffect(() => {
    localStorage.setItem('gci:language', language)
    document.documentElement.lang = language
  }, [language])
  useEffect(() => { try { localStorage.setItem('gci:companies', JSON.stringify(companies)) } catch { /* storage is optional */ } }, [companies])
  useEffect(() => {
    try {
      if (user) localStorage.setItem('gci:user', JSON.stringify(user))
      if (activeCompanyId) localStorage.setItem('gci:active-company', activeCompanyId)
    } catch { /* storage is optional */ }
  }, [user, activeCompanyId])
  useEffect(() => {
    try { localStorage.setItem('gci:scenarios', JSON.stringify(saved)) } catch { /* storage is optional */ }
  }, [saved])

  if (!user) return <LoginScreen language={language} onLanguageChange={setLanguage} onSignIn={(nextUser) => { setUser(nextUser); setSetupOpen(true) }} />
  if (setupOpen || !activeCompanyId || !companies.some((company) => company.id === activeCompanyId)) {
    return <CompanySetup language={language} onLanguageChange={setLanguage} user={user} companies={companies} activeCompanyId={activeCompanyId} initialYear={inputs.year} onAddCompany={addCompany} onContinue={selectCompany} onClose={activeCompanyId ? () => setSetupOpen(false) : undefined} onSignOut={signOut} />
  }

  const P = { overview: Overview, data: CompanyData, analysis: Analysis, scenario: Scenario }[page]
  return (
    <AppCtx.Provider value={{ page, go, sub, user, companies, activeCompanyId, selectCompany, openCompanySetup: () => setSetupOpen(true), signOut, language, setLanguage, inputs, setInputs, importCompanyData, result, run, running, ctrPct, setCtrPct, rrfS, setRrfS, saved, setSaved, toast, updated }}>
      <Shell><Suspense fallback={<div className="flex min-h-[45vh] items-center justify-center gap-2 text-[13px] text-mute"><Loader2 size={16} className="animate-spin" />{tr(language, 'Loading workspace…')}</div>}><P /></Suspense></Shell>
      <div className="fixed right-4 bottom-4 z-[90] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 border border-[#404040] bg-navy px-4 py-3 text-[13px] text-white shadow-xl">
            {t.tone === 'error' ? <XCircle size={16} className="text-[#d6d3d1]" /> : t.tone === 'info' ? <Info size={16} className="text-[#d6d3d1]" /> : <CheckCircle2 size={16} className="text-[#d6d3d1]" />}{t.msg}
          </div>
        ))}
      </div>
    </AppCtx.Provider>
  )
}
