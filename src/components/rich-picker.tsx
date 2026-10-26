import * as React from "react"
import { Combobox } from "@base-ui/react/combobox"
import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react"
import { cn } from "cn"

// busca sem diferenciar maiusculas e acentos ("cachaca" encontra "Cachaça")
function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

type RichPickerProps<T> = {
  id?: string
  items: T[]
  value: T | null
  onValueChange: (value: T | null) => void
  getId: (item: T) => string
  getLabel: (item: T) => string
  // texto usado na busca, alem do label (ex.: descricao)
  getSearchText?: (item: T) => string
  renderItem: (item: T) => React.ReactNode
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  invalid?: boolean
  disabled?: boolean
}

export function RichPicker<T>({
  id,
  items,
  value,
  onValueChange,
  getId,
  getLabel,
  getSearchText,
  renderItem,
  placeholder,
  searchPlaceholder,
  emptyText,
  invalid,
  disabled,
}: RichPickerProps<T>) {
  const filter = React.useCallback(
    (item: T, query: string) => {
      const text = `${getLabel(item)} ${getSearchText?.(item) ?? ""}`
      return normalize(text).includes(normalize(query.trim()))
    },
    [getLabel, getSearchText]
  )

  return (
    <Combobox.Root
      items={items}
      value={value}
      onValueChange={(next) => onValueChange(next as T | null)}
      itemToStringLabel={getLabel}
      isItemEqualToValue={(a, b) => getId(a) === getId(b)}
      filter={filter}
      disabled={disabled}
    >
      <Combobox.Trigger
        id={id}
        aria-invalid={invalid}
        className="flex min-h-9 w-full items-center gap-3 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-left text-sm transition-colors outline-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-popup-open:border-ring dark:bg-input/30"
      >
        <span className="min-w-0 flex-1">
          {value ? (
            renderItem(value)
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </Combobox.Trigger>

      <Combobox.Portal>
        <Combobox.Positioner align="start" sideOffset={6} className="z-50">
          <Combobox.Popup
            aria-label={searchPlaceholder}
            className="flex max-h-[min(26rem,var(--available-height))] w-[var(--anchor-width)] max-w-[var(--available-width)] min-w-72 origin-[var(--transform-origin)] flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
          >
            <div className="flex items-center gap-2 border-b px-3">
              <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
              <Combobox.Input
                placeholder={searchPlaceholder}
                className="h-10 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
              />
            </div>
            <Combobox.Empty>
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </div>
            </Combobox.Empty>
            <Combobox.List className="scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0">
              {(item: T) => (
                <Combobox.Item
                  key={getId(item)}
                  value={item}
                  className={cn(
                    "flex cursor-default items-center gap-3 rounded-lg px-2 py-2 outline-none select-none data-highlighted:bg-muted data-selected:bg-primary/10"
                  )}
                >
                  <span className="min-w-0 flex-1">{renderItem(item)}</span>
                  <Combobox.ItemIndicator>
                    <CheckIcon className="size-4 text-primary" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
