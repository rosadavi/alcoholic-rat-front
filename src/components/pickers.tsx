import { MapPin, Store, Wine } from "lucide-react"

import type { Bar, Drink } from "@/lib/api"
import { formatPercentage, formatVolume } from "@/lib/drink-rules"
import { RichPicker } from "@/components/rich-picker"

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  )
}

function BarOption({ bar }: { bar: Bar }) {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Store className="size-4" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{bar.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {bar.description || "Sem descrição"}
        </span>
        <span className="flex items-center gap-1 font-mono text-[0.7rem] text-muted-foreground">
          <MapPin className="size-3" />
          {bar.latitude.toFixed(4)}, {bar.longitude.toFixed(4)}
        </span>
      </span>
    </span>
  )
}

function DrinkOption({ drink }: { drink: Drink }) {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Wine className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{drink.title}</span>
        </span>
        {drink.description && (
          <span className="truncate text-xs text-muted-foreground">
            {drink.description}
          </span>
        )}
        <span className="flex flex-wrap gap-1">
          <Chip>{formatVolume(drink.volumeMl)}</Chip>
          <Chip>{formatPercentage(drink.alcoholPercentage)}</Chip>
        </span>
      </span>
    </span>
  )
}

type PickerProps<T> = {
  id?: string
  items: T[]
  value: T | null
  onValueChange: (value: T | null) => void
  invalid?: boolean
  disabled?: boolean
}

export function BarPicker(props: PickerProps<Bar>) {
  return (
    <RichPicker
      {...props}
      getId={(bar) => bar.id}
      getLabel={(bar) => bar.name}
      getSearchText={(bar) => bar.description ?? ""}
      renderItem={(bar) => <BarOption bar={bar} />}
      placeholder="Escolha um bar"
      searchPlaceholder="Buscar bar pelo nome"
      emptyText="Nenhum bar encontrado."
    />
  )
}

export function DrinkPicker(props: PickerProps<Drink>) {
  return (
    <RichPicker
      {...props}
      getId={(drink) => drink.id}
      getLabel={(drink) => drink.title}
      getSearchText={(drink) => drink.description ?? ""}
      renderItem={(drink) => <DrinkOption drink={drink} />}
      placeholder="Escolha uma bebida"
      searchPlaceholder="Buscar bebida pelo nome"
      emptyText="Nenhuma bebida encontrada."
    />
  )
}
