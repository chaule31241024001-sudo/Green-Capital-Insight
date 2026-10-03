import { createContext, useContext } from 'react'
import type { Inputs, Result } from './model'

export type Page = 'overview' | 'data' | 'analysis' | 'scenario'
export type Saved = { name: string; desc: string; ctr: number; rrf: number }
export type InternalUser = { name: string; email: string; role: string }
export type CompanyProfile = { id: string; name: string; industry: string; code: string; country: string }
export type Ctx = {
  page: Page; go: (p: Page, sub?: string) => void; sub?: string
  user: InternalUser
  companies: CompanyProfile[]
  activeCompanyId: string
  selectCompany: (id: string, year?: number) => void
  openCompanySetup: () => void
  signOut: () => void
  inputs: Inputs; setInputs: (i: Inputs) => void
  result: Result | null; run: () => Promise<void>; running: boolean
  ctrPct: number; setCtrPct: (n: number) => void; rrfS: number; setRrfS: (n: number) => void
  saved: Saved[]; setSaved: (s: Saved[]) => void
  toast: (msg: string, tone?: 'success' | 'error' | 'info') => void
  updated: string
}
export const AppCtx = createContext<Ctx>(null!)
export const useApp = () => useContext(AppCtx)
