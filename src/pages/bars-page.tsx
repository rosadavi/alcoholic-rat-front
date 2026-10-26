import * as React from "react"
import { MapPin, Plus, RefreshCw, Search, Store } from "lucide-react"

import { api, ApiError, type Bar } from "@/lib/api"
import { useSession } from "@/lib/auth"
import { BarForm } from "@/components/bar-form"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

function mapsUrl(bar: Bar) {
  return `https://www.google.com/maps/search/?api=1&query=${bar.latitude},${bar.longitude}`
}

export function BarsPage() {
  const { token, role } = useSession()
  const [bars, setBars] = React.useState<Bar[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")
  const [formOpen, setFormOpen] = React.useState(false)
  const [notice, setNotice] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setError(null)
    setBars(null)
    try {
      setBars(await api.listBars(token))
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao carregar os bares."
      )
    }
  }, [token])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  function handleCreated(bar: Bar) {
    setBars((current) => [...(current ?? []), bar])
    setFormOpen(false)
    setNotice(`"${bar.name}" foi cadastrado.`)
  }

  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    const list = [...(bars ?? [])].sort((a, b) => a.name.localeCompare(b.name))
    if (!term) return list
    return list.filter(
      (bar) =>
        bar.name.toLowerCase().includes(term) ||
        bar.description?.toLowerCase().includes(term)
    )
  }, [bars, query])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Bares
          </h1>
          <p className="text-sm text-muted-foreground">
            Os lugares disponíveis para marcar nos seus rolês.
          </p>
        </div>
        {role === "ADMIN" && (
          <Button size="lg" onClick={() => setFormOpen(true)}>
            <Plus />
            Novo bar
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
            placeholder="Buscar bar"
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
      ) : bars === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
          <Store className="size-8 text-muted-foreground" />
          <p className="font-medium">
            {bars.length === 0
              ? "Nenhum bar cadastrado"
              : "Nenhum bar encontrado"}
          </p>
          <p className="text-sm text-muted-foreground">
            {bars.length === 0
              ? role === "ADMIN"
                ? "Cadastre o primeiro bar no botão Novo bar."
                : "Assim que um administrador cadastrar, ele aparece aqui."
              : "Tente outro termo de busca."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((bar) => (
            <Card key={bar.id}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Store className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate">{bar.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {bar.latitude.toFixed(5)}, {bar.longitude.toFixed(5)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {bar.description || "Sem descrição."}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a href={mapsUrl(bar)} target="_blank" rel="noreferrer" />
                  }
                  nativeButton={false}
                >
                  <MapPin />
                  Ver no mapa
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Novo bar</SheetTitle>
            <SheetDescription>
              Ele fica disponível para todos os usuários.
            </SheetDescription>
          </SheetHeader>
          {formOpen && <BarForm onCreated={handleCreated} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}
