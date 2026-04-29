"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type AuthUser = {
  id: string
  name: string
  email: string
  createdAt: string
}

type StoredUser = AuthUser & { passwordHash: string }

type SignUpInput = { name: string; email: string; password: string }
type LoginInput = { email: string; password: string }

type AuthResult = { ok: true } | { ok: false; error: string }

type AuthContextValue = {
  user: AuthUser | null
  isHydrated: boolean
  isAuthenticated: boolean
  signUp: (input: SignUpInput) => AuthResult
  login: (input: LoginInput) => AuthResult
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const USERS_KEY = "tj.auth.users.v1"
const SESSION_KEY = "tj.auth.session.v1"

/**
 * Mock-only password "hash". This is NOT secure and is only used to keep raw
 * passwords out of localStorage during the MVP. Replace with real auth later.
 */
function mockHash(password: string): string {
  let hash = 5381
  for (let i = 0; i < password.length; i++) {
    hash = (hash * 33) ^ password.charCodeAt(i)
  }
  return `mh1.${(hash >>> 0).toString(16)}.${password.length}`
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    /* ignore */
  }
}

function readSession(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function writeSession(user: AuthUser | null) {
  try {
    if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else window.localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export function AuthStoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setUser(readSession())
    setIsHydrated(true)
  }, [])

  const signUp = useCallback(({ name, email, password }: SignUpInput): AuthResult => {
    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()
    if (!cleanName) return { ok: false, error: "Please enter your name." }
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return { ok: false, error: "Please enter a valid email address." }
    }
    if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." }

    const users = readUsers()
    if (users.some((u) => u.email === cleanEmail)) {
      return { ok: false, error: "An account with that email already exists." }
    }

    const newUser: StoredUser = {
      id: `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      name: cleanName,
      email: cleanEmail,
      createdAt: new Date().toISOString(),
      passwordHash: mockHash(password),
    }
    writeUsers([...users, newUser])

    const sessionUser: AuthUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
    }
    writeSession(sessionUser)
    setUser(sessionUser)
    return { ok: true }
  }, [])

  const login = useCallback(({ email, password }: LoginInput): AuthResult => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) return { ok: false, error: "Email and password are required." }

    const users = readUsers()
    const found = users.find((u) => u.email === cleanEmail)
    if (!found || found.passwordHash !== mockHash(password)) {
      return { ok: false, error: "Invalid email or password." }
    }

    const sessionUser: AuthUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      createdAt: found.createdAt,
    }
    writeSession(sessionUser)
    setUser(sessionUser)
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    writeSession(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isHydrated,
      isAuthenticated: user !== null,
      signUp,
      login,
      logout,
    }),
    [user, isHydrated, signUp, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthStoreProvider")
  return ctx
}
