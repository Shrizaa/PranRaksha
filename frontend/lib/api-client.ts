const TOKEN_KEY = "aegis_token"
const USER_KEY = "aegis_user"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function getUser(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(USER_KEY)
}

export function setSession(token: string, user: string) {
  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(USER_KEY, user)
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

export async function login(username: string, password: string) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail ?? "Login failed")
  return data as {
    message: string
    username: string
    access_token: string
    token_type: string
  }
}

export interface LocationPayload {
  latitude: number
  longitude: number
  relief_days: number
}

export async function callFeature<T = unknown>(
  endpoint: string,
  payload: LocationPayload,
): Promise<T> {
  const token = getToken()
  const res = await fetch(`/api/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? ""}`,
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail ?? "Request failed")
  return data as T
}

export async function fetchWarehouses() {
  const token = getToken()
  const res = await fetch("/api/warehouses", {
    headers: { Authorization: `Bearer ${token ?? ""}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail ?? "Request failed")
  return data.warehouses
}
