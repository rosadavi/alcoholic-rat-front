const API_URL = import.meta.env.VITE_API_URL ?? "/api"

export type UserRole = "ADMIN" | "USER"

export type Bar = {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
}

export type BarRequest = {
  name: string
  description?: string
  latitude: number
  longitude: number
}

export type RegisterResponse = {
  id: string
  login: string
  role: UserRole
}

// mensagens fixas da API traduzidas para exibir na tela
const ERROR_MESSAGES: Record<string, string> = {
  "Invalid login or password": "Login ou senha inválidos.",
  "You must be logged in to access this resource!":
    "Sua sessão expirou. Entre novamente.",
  "Only administrators can perform this action!":
    "Apenas administradores podem fazer isso.",
}

export class ApiError extends Error {
  status: number
  fieldErrors: Record<string, string>

  constructor(
    status: number,
    message: string,
    fieldErrors: Record<string, string> = {}
  ) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

let unauthorizedHandler: (() => void) | null = null

export function onUnauthorized(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

function translate(message: string) {
  if (ERROR_MESSAGES[message]) return ERROR_MESSAGES[message]
  if (message.startsWith("Login already exists"))
    return "Este email já está cadastrado."
  if (message.startsWith("Bar already exists"))
    return "Já existe um bar com esse nome."
  return message
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers["Content-Type"] = "application/json"
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API.")
  }

  const text = await response.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    // token ausente/expirado em rota protegida (o login devolve 401 por senha errada)
    if (response.status === 401 && options.token) unauthorizedHandler?.()

    if (data && typeof data === "object") {
      const body = data as Record<string, unknown>
      if (typeof body.error === "string" && !("status" in body)) {
        throw new ApiError(response.status, translate(body.error))
      }
      // 400 de validacao: { campo: mensagem }
      if (response.status === 400 && !("status" in body)) {
        throw new ApiError(
          response.status,
          "Confira os campos destacados.",
          body as Record<string, string>
        )
      }
    }
    throw new ApiError(response.status, `Erro inesperado (${response.status}).`)
  }

  return data as T
}

export const api = {
  login: (login: string, password: string) =>
    request<{ token: string }>("/auth/login", {
      method: "POST",
      body: { login, password },
    }),

  register: (login: string, password: string) =>
    request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: { login, password },
    }),

  listBars: (token: string) => request<Bar[]>("/bars", { token }),

  createBar: (token: string, data: BarRequest) =>
    request<Bar>("/bars", { method: "POST", token, body: data }),

  // O token nao carrega o papel do usuario. POST /bars com corpo vazio e
  // barrado com 403 para USER e com 400 (validacao) para ADMIN, sem criar nada.
  probeRole: async (token: string): Promise<UserRole> => {
    try {
      await request("/bars", { method: "POST", token, body: {} })
      return "ADMIN"
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) return "ADMIN"
      if (error instanceof ApiError && error.status === 403) return "USER"
      throw error
    }
  },
}
