import * as React from "react"
import { Loader2 } from "lucide-react"

import { api, ApiError, type Drink } from "@/lib/api"
import { useSession } from "@/lib/auth"
import {
  parsePercentage,
  percentageError,
  volumeError,
} from "@/lib/drink-rules"
import { FormField } from "@/components/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type DrinkFormProps = {
  onCreated: (drink: Drink) => void
}

function validate(values: Record<string, string>) {
  const errors: Record<string, string> = {}
  if (!values.title.trim()) errors.title = "Informe o nome da bebida."
  else if (values.title.trim().length > 100)
    errors.title = "Use no máximo 100 caracteres."
  if (values.description.length > 1000)
    errors.description = "Use no máximo 1000 caracteres."
  const volume = volumeError(values.volumeMl)
  if (volume) errors.volumeMl = volume
  const percentage = percentageError(values.alcoholPercentage)
  if (percentage) errors.alcoholPercentage = percentage
  return errors
}

export function DrinkForm({ onCreated }: DrinkFormProps) {
  const { token } = useSession()
  const [values, setValues] = React.useState({
    title: "",
    description: "",
    volumeMl: "",
    alcoholPercentage: "",
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  function setField(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const validation = validate(values)
    setErrors(validation)
    setFormError(null)
    if (Object.keys(validation).length > 0) return

    setLoading(true)
    try {
      const drink = await api.createDrink(token, {
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        volumeMl: Number(values.volumeMl),
        alcoholPercentage: parsePercentage(values.alcoholPercentage),
      })
      onCreated(drink)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors)
        setFormError(error.message)
        if (error.status === 409) setErrors({ title: error.message })
      } else {
        setFormError("Algo deu errado. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4"
    >
      <FormField id="drink-title" label="Nome" error={errors.title}>
        <Input
          id="drink-title"
          placeholder="Ex.: Heineken Long Neck"
          maxLength={100}
          value={values.title}
          onChange={(e) => setField("title", e.target.value)}
          aria-invalid={!!errors.title}
          className="h-9"
        />
      </FormField>

      <FormField
        id="drink-description"
        label="Descrição (opcional)"
        error={errors.description}
        hint={`${values.description.length}/1000`}
      >
        <Textarea
          id="drink-description"
          placeholder="Ex.: cerveja lager"
          maxLength={1000}
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          aria-invalid={!!errors.description}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="drink-volume"
          label="Volume (ml)"
          error={errors.volumeMl}
        >
          <Input
            id="drink-volume"
            inputMode="numeric"
            placeholder="330"
            value={values.volumeMl}
            onChange={(e) => setField("volumeMl", e.target.value)}
            aria-invalid={!!errors.volumeMl}
            className="h-9"
          />
        </FormField>
        <FormField
          id="drink-percentage"
          label="Teor alcoólico (%)"
          error={errors.alcoholPercentage}
        >
          <Input
            id="drink-percentage"
            inputMode="decimal"
            placeholder="5"
            value={values.alcoholPercentage}
            onChange={(e) => setField("alcoholPercentage", e.target.value)}
            aria-invalid={!!errors.alcoholPercentage}
            className="h-9"
          />
        </FormField>
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" className="mt-auto" disabled={loading}>
        {loading && <Loader2 className="animate-spin" />}
        Cadastrar bebida
      </Button>
    </form>
  )
}
