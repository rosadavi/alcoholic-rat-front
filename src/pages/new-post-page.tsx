import * as React from "react"
import {
  CheckCircle2,
  Loader2,
  Plus,
  Store,
  Trash2,
  Wine,
  X,
} from "lucide-react"

import {
  api,
  ApiError,
  type Bar,
  type Drink,
  type Post,
  type PostDrinkRequest,
} from "@/lib/api"
import { useSession } from "@/lib/auth"
import {
  formatPercentage,
  formatVolume,
  parsePercentage,
  percentageError,
  volumeError,
} from "@/lib/drink-rules"
import { FormField } from "@/components/form-field"
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
import { BarPicker, DrinkPicker } from "@/components/pickers"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type DrinkItem = {
  key: number
  source: "catalog" | "custom"
  drinkId: string
  title: string
  volumeMl: string
  alcoholPercentage: string
}

let nextKey = 0

function newItem(source: DrinkItem["source"]): DrinkItem {
  return {
    key: nextKey++,
    source,
    drinkId: "",
    title: "",
    volumeMl: "",
    alcoholPercentage: "",
  }
}

// as chaves seguem o formato dos erros de validacao da API: drinks[0].volumeMl
function validate(description: string, items: DrinkItem[]) {
  const errors: Record<string, string> = {}
  if (description.length > 1000)
    errors.description = "Use no máximo 1000 caracteres."
  if (items.length === 0) errors.drinks = "Adicione pelo menos uma bebida."

  items.forEach((item, i) => {
    const prefix = `drinks[${i}]`
    if (item.source === "catalog") {
      if (!item.drinkId) errors[`${prefix}.drinkId`] = "Escolha uma bebida."
      // no catalogo, volume e teor so substituem o valor cadastrado se preenchidos
      const volume = item.volumeMl.trim() && volumeError(item.volumeMl)
      if (volume) errors[`${prefix}.volumeMl`] = volume
      const percentage =
        item.alcoholPercentage.trim() && percentageError(item.alcoholPercentage)
      if (percentage) errors[`${prefix}.alcoholPercentage`] = percentage
      return
    }

    if (!item.title.trim()) errors[`${prefix}.title`] = "Informe o nome."
    else if (item.title.trim().length > 100)
      errors[`${prefix}.title`] = "Use no máximo 100 caracteres."
    const volume = volumeError(item.volumeMl)
    if (volume) errors[`${prefix}.volumeMl`] = volume
    const percentage = percentageError(item.alcoholPercentage)
    if (percentage) errors[`${prefix}.alcoholPercentage`] = percentage
  })
  return errors
}

function toRequest(item: DrinkItem): PostDrinkRequest {
  if (item.source === "catalog") {
    return {
      drinkId: item.drinkId,
      volumeMl: item.volumeMl.trim() ? Number(item.volumeMl) : undefined,
      alcoholPercentage: item.alcoholPercentage.trim()
        ? parsePercentage(item.alcoholPercentage)
        : undefined,
    }
  }
  return {
    title: item.title.trim(),
    volumeMl: Number(item.volumeMl),
    alcoholPercentage: parsePercentage(item.alcoholPercentage),
  }
}

export function NewPostPage() {
  const { token } = useSession()
  const [bars, setBars] = React.useState<Bar[] | null>(null)
  const [drinks, setDrinks] = React.useState<Drink[] | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  const [barId, setBarId] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [items, setItems] = React.useState<DrinkItem[]>([])
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [created, setCreated] = React.useState<Post | null>(null)

  const load = React.useCallback(async () => {
    setLoadError(null)
    setBars(null)
    setDrinks(null)
    try {
      const [barList, drinkList] = await Promise.all([
        api.listBars(token),
        api.listDrinks(token),
      ])
      setBars([...barList].sort((a, b) => a.name.localeCompare(b.name)))
      setDrinks([...drinkList].sort((a, b) => a.title.localeCompare(b.title)))
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? err.message
          : "Erro ao carregar bares e bebidas."
      )
    }
  }, [token])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  function updateItem(key: number, changes: Partial<DrinkItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...changes } : item))
    )
  }

  function reset() {
    setCreated(null)
    setBarId("")
    setDescription("")
    setItems([])
    setErrors({})
    setFormError(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const validation = validate(description, items)
    setErrors(validation)
    setFormError(null)
    if (Object.keys(validation).length > 0) {
      setFormError("Confira os campos destacados.")
      return
    }

    setLoading(true)
    try {
      const post = await api.createPost(token, {
        barId: barId || undefined,
        description: description.trim() || undefined,
        drinks: items.map(toRequest),
      })
      setCreated(post)
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

  if (created) {
    return (
      <PostCreated
        post={created}
        bar={bars?.find((bar) => bar.id === created.barId)}
        onNew={reset}
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Publicar rolê
        </h1>
        <p className="text-sm text-muted-foreground">
          Conte onde você está e o que está bebendo.
        </p>
      </div>

      {loadError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" onClick={load}>
            Tentar de novo
          </Button>
        </div>
      ) : bars === null || drinks === null ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Onde</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormField
                id="post-bar"
                label="Bar (opcional)"
                error={errors.barId}
                hint={
                  bars.length === 0 ? "Nenhum bar cadastrado ainda." : undefined
                }
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <BarPicker
                      id="post-bar"
                      items={bars}
                      value={bars.find((bar) => bar.id === barId) ?? null}
                      onValueChange={(bar) => setBarId(bar?.id ?? "")}
                      invalid={!!errors.barId}
                      disabled={bars.length === 0}
                    />
                  </div>
                  {barId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-lg"
                      onClick={() => setBarId("")}
                      aria-label="Remover bar"
                    >
                      <X />
                    </Button>
                  )}
                </div>
              </FormField>

              <FormField
                id="post-description"
                label="Descrição (opcional)"
                error={errors.description}
                hint={`${description.length}/1000`}
              >
                <Textarea
                  id="post-description"
                  placeholder="Sextou!"
                  maxLength={1000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  aria-invalid={!!errors.description}
                />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bebidas</CardTitle>
              <CardDescription>
                Escolha do catálogo ou informe uma bebida sua. Depois de
                publicado, o que foi registrado não muda.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {items.length === 0 && (
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border border-dashed p-6 text-center",
                    errors.drinks && "border-destructive"
                  )}
                >
                  <Wine className="size-6 text-muted-foreground" />
                  <p className="text-sm font-medium">Nenhuma bebida ainda</p>
                  <p
                    className={cn(
                      "text-xs text-muted-foreground",
                      errors.drinks && "text-destructive"
                    )}
                  >
                    {errors.drinks ??
                      "Adicione pelo menos uma nos botões abaixo."}
                  </p>
                </div>
              )}
              {items.map((item, i) => (
                <DrinkItemFields
                  key={item.key}
                  index={i}
                  item={item}
                  catalog={drinks}
                  errors={errors}
                  onChange={(changes) => updateItem(item.key, changes)}
                  onRemove={() =>
                    setItems((current) =>
                      current.filter((other) => other.key !== item.key)
                    )
                  }
                />
              ))}
            </CardContent>
            <CardFooter className="flex-wrap">
              {drinks.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setItems((current) => [...current, newItem("catalog")])
                  }
                >
                  <Plus />
                  Do catálogo
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setItems((current) => [...current, newItem("custom")])
                }
              >
                <Plus />
                Bebida própria
              </Button>
            </CardFooter>
          </Card>

          {formError && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </p>
          )}

          <Button type="submit" size="lg" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Publicar
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            O envio de fotos ainda não existe na API.
          </p>
        </form>
      )}
    </div>
  )
}

type DrinkItemFieldsProps = {
  index: number
  item: DrinkItem
  catalog: Drink[]
  errors: Record<string, string>
  onChange: (changes: Partial<DrinkItem>) => void
  onRemove: () => void
}

function DrinkItemFields({
  index,
  item,
  catalog,
  errors,
  onChange,
  onRemove,
}: DrinkItemFieldsProps) {
  const prefix = `drinks[${index}]`
  const id = `post-drink-${item.key}`
  const selected = catalog.find((drink) => drink.id === item.drinkId)
  const isCatalog = item.source === "catalog"

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {index + 1}. {isCatalog ? "Do catálogo" : "Bebida própria"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remover bebida"
        >
          <Trash2 />
        </Button>
      </div>

      {isCatalog ? (
        <FormField
          id={`${id}-drink`}
          label="Bebida"
          error={errors[`${prefix}.drinkId`]}
        >
          <DrinkPicker
            id={`${id}-drink`}
            items={catalog}
            value={selected ?? null}
            onValueChange={(drink) => onChange({ drinkId: drink?.id ?? "" })}
            invalid={!!errors[`${prefix}.drinkId`]}
          />
        </FormField>
      ) : (
        <FormField
          id={`${id}-title`}
          label="Nome"
          error={errors[`${prefix}.title`]}
        >
          <Input
            id={`${id}-title`}
            placeholder="Ex.: caipirinha da casa"
            maxLength={100}
            value={item.title}
            onChange={(e) => onChange({ title: e.target.value })}
            aria-invalid={!!errors[`${prefix}.title`]}
            className="h-9"
          />
        </FormField>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField
          id={`${id}-volume`}
          label="Volume (ml)"
          error={errors[`${prefix}.volumeMl`]}
          hint={isCatalog ? "Vazio usa o do catálogo." : undefined}
        >
          <Input
            id={`${id}-volume`}
            inputMode="numeric"
            placeholder={selected ? String(selected.volumeMl) : "300"}
            value={item.volumeMl}
            onChange={(e) => onChange({ volumeMl: e.target.value })}
            aria-invalid={!!errors[`${prefix}.volumeMl`]}
            className="h-9"
          />
        </FormField>
        <FormField
          id={`${id}-percentage`}
          label="Teor (%)"
          error={errors[`${prefix}.alcoholPercentage`]}
          hint={isCatalog ? "Vazio usa o do catálogo." : undefined}
        >
          <Input
            id={`${id}-percentage`}
            inputMode="decimal"
            placeholder={selected ? String(selected.alcoholPercentage) : "15"}
            value={item.alcoholPercentage}
            onChange={(e) => onChange({ alcoholPercentage: e.target.value })}
            aria-invalid={!!errors[`${prefix}.alcoholPercentage`]}
            className="h-9"
          />
        </FormField>
      </div>
    </div>
  )
}

type PostCreatedProps = {
  post: Post
  bar?: Bar
  onNew: () => void
}

function PostCreated({ post, bar, onNew }: PostCreatedProps) {
  const totalMl = post.drinks.reduce((sum, drink) => sum + drink.volumeMl, 0)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="size-8 text-primary" />
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Rolê publicado
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(post.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="size-4 text-muted-foreground" />
            {bar?.name ?? "Sem bar"}
          </CardTitle>
          {post.description && (
            <CardDescription className="whitespace-pre-line">
              {post.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y">
            {post.drinks.map((drink) => (
              <li
                key={drink.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Wine className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{drink.title}</span>
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {formatVolume(drink.volumeMl)} ·{" "}
                  {formatPercentage(drink.alcoholPercentage)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="justify-between text-sm">
          <span className="text-muted-foreground">
            {post.drinks.length}{" "}
            {post.drinks.length === 1 ? "bebida" : "bebidas"}
          </span>
          <span className="font-medium">Total: {formatVolume(totalMl)}</span>
        </CardFooter>
      </Card>

      <Button size="lg" onClick={onNew}>
        <Plus />
        Publicar outro
      </Button>
    </div>
  )
}
