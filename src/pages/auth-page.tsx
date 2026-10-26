import * as React from "react"
import { Beer, Loader2 } from "lucide-react"

import { ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { FormField } from "@/components/form-field"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Mode = "login" | "register"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(mode: Mode, login: string, password: string) {
  const errors: Record<string, string> = {}
  if (!login.trim()) errors.login = "Informe seu email."
  else if (mode === "register" && !EMAIL_PATTERN.test(login.trim()))
    errors.login = "Informe um email válido."
  if (!password) errors.password = "Informe sua senha."
  else if (mode === "register" && (password.length < 8 || password.length > 72))
    errors.password = "A senha deve ter de 8 a 72 caracteres."
  return errors
}

export function AuthPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = React.useState<Mode>("login")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setErrors({})
    setFormError(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const validation = validate(mode, email, password)
    setErrors(validation)
    setFormError(null)
    if (Object.keys(validation).length > 0) return

    setLoading(true)
    try {
      if (mode === "login") await login(email, password)
      else await register(email, password)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors)
        setFormError(error.message)
      } else {
        setFormError("Algo deu errado. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  const isLogin = mode === "login"

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Beer className="size-6" />
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Alcoholic Rat
        </h1>
        <p className="text-sm text-muted-foreground">
          Registre seus rolês e veja onde a galera está bebendo.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{isLogin ? "Entrar" : "Criar conta"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Use seu email e senha para entrar."
              : "Cadastre-se com seu email para começar."}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="flex flex-col gap-4">
            <FormField id="login" label="Email" error={errors.login}>
              <Input
                id="login"
                type="email"
                autoComplete="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.login}
                className="h-9"
              />
            </FormField>

            <FormField
              id="password"
              label="Senha"
              error={errors.password}
              hint={isLogin ? undefined : "De 8 a 72 caracteres."}
            >
              <Input
                id="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
                className="h-9"
              />
            </FormField>

            {formError && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </p>
            )}
          </CardContent>

          <CardFooter className="mt-4 flex-col">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="animate-spin" />}
              {isLogin ? "Entrar" : "Criar conta"}
            </Button>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => switchMode(isLogin ? "register" : "login")}
              >
                {isLogin ? "Cadastre-se" : "Entrar"}
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
