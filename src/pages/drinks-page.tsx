import * as React from "react"
import { Plus, RefreshCw, Search, Wine } from "lucide-react"

import { api, ApiError, type Drink } from "@/lib/api"
import { useSession } from "@/lib/auth"
import { formatPercentage, formatVolume } from "@/lib/drink-rules"
import { DrinkForm } from "@/components/drink-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

export function DrinksPage() {
  const { token, role } = useSession()
  const [drinks, setDrinks] = React.useState<Drink[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")
  const [formOpen, setFormOpen] = React.useState(false)
  const [notice, setNotice] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setError(null)
    setDrinks(null)
    try {
      setDrinks(await api.listDrinks(token))
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao carregar as bebidas."
      )
    }
  }, [token])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  function handleCreated(drink: Drink) {
    setDrinks((current) => [...(current ?? []), drink])
    setFormOpen(false)
    setNotice(`"${drink.title}" foi cadastrada.`)
  }

  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    const list = [...(drinks ?? [])].sort((a, b) =>
      a.title.localeCompare(b.title)
    )
    if (!term) return list
    return list.filter(
      (drink) =>
        drink.title.toLowerCase().includes(term) ||
        drink.description?.toLowerCase().includes(term)
    )
  }, [drinks, query])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Bebidas
          </h1>
          <p className="text-sm text-muted-foreground">
            O catálogo para escolher ao publicar um rolê.
          </p>
        </div>
        {role === "ADMIN" && (
          <Button size="lg" onClick={() => setFormOpen(true)}>
            <Plus />
            Nova bebida
          </Button>
        )}
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
          <span>{notice}</span>
          <Button variant="ghost" size="xs" onClick={() => setNotice(null)}>
            Fechar
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar bebida"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="icon-lg"
          onClick={load}
          aria-label="Atualizar lista"
        >
          <RefreshCw />
        </Button>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={load}>
            Tentar de novo
          </Button>
        </div>
      ) : drinks === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
          <Wine className="size-8 text-muted-foreground" />
          <p className="font-medium">
            {drinks.length === 0
              ? "Nenhuma bebida cadastrada"
              : "Nenhuma bebida encontrada"}
          </p>
          <p className="text-sm text-muted-foreground">
            {drinks.length === 0
              ? role === "ADMIN"
                ? "Cadastre a primeira bebida no botão Nova bebida."
                : "Assim que um administrador cadastrar, ela aparece aqui."
              : "Tente outro termo de busca."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((drink) => (
            <Card key={drink.id}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Wine className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate">{drink.title}</CardTitle>
                    <CardDescription>
                      {formatVolume(drink.volumeMl)} ·{" "}
                      {formatPercentage(drink.alcoholPercentage)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {drink.description || "Sem descrição."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Nova bebida</SheetTitle>
            <SheetDescription>
              Ela fica disponível no catálogo para todos os usuários.
            </SheetDescription>
          </SheetHeader>
          {formOpen && <DrinkForm onCreated={handleCreated} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}
