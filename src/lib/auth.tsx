import * as React from "react"

import { api, onUnauthorized, type UserRole } from "@/lib/api"

const STORAGE_KEY = "alcoholic-rat:session"

type Session = {
  token: string
  login: string
  role: UserRole
  expiresAt: number
}

type AuthState = {
  session: Session | null
  login: (login: string, password: string) => Promise<void>
  register: (login: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = React.createContext<AuthState | undefined>(undefined)

function decodeToken(token: string): { sub: string; exp: number } {
  const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
  return JSON.parse(atob(payload))
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    if (session.expiresAt <= Date.now()) return null
    return session
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(loadSession)

  const logout = React.useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }, [])

  const login = React.useCallback(async (login: string, password: string) => {
    const { token } = await api.login(login.trim().toLowerCase(), password)
    const { sub, exp } = decodeToken(token)
    const role = await api.probeRole(token)
    const next = { token, login: sub, role, expiresAt: exp * 1000 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSession(next)
  }, [])

  const register = React.useCallback(
    async (email: string, password: string) => {
      await api.register(email.trim().toLowerCase(), password)
      await login(email, password)
    },
    [login]
  )

  React.useEffect(() => {
    onUnauthorized(logout)
    return () => onUnauthorized(null)
  }, [logout])

  // encerra a sessao quando o token expira (2h)
  React.useEffect(() => {
    if (!session) return
    const timeout = window.setTimeout(logout, session.expiresAt - Date.now())
    return () => window.clearTimeout(timeout)
  }, [session, logout])

  const value = React.useMemo(
    () => ({ session, login, register, logout }),
    [session, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function useSession() {
  const { session } = useAuth()
  if (!session) throw new Error("useSession requires a logged in user")
  return session
}
