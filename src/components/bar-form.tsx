import * as React from "react"
import { Loader2, LocateFixed } from "lucide-react"

import { api, ApiError, type Bar } from "@/lib/api"
import { useSession } from "@/lib/auth"
import { FormField } from "@/components/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type BarFormProps = {
  onCreated: (bar: Bar) => void
}

function validate(values: Record<string, string>) {
  const errors: Record<string, string> = {}
  const latitude = Number(values.latitude)
  const longitude = Number(values.longitude)

  if (!values.name.trim()) errors.name = "Informe o nome do bar."
  else if (values.name.trim().length > 100)
    errors.name = "Use no máximo 100 caracteres."
  if (values.description.length > 1000)
    errors.description = "Use no máximo 1000 caracteres."
  if (!values.latitude.trim() || Number.isNaN(latitude))
    errors.latitude = "Informe uma latitude."
  else if (latitude < -90 || latitude > 90)
    errors.latitude = "Deve estar entre -90 e 90."
  if (!values.longitude.trim() || Number.isNaN(longitude))
    errors.longitude = "Informe uma longitude."
  else if (longitude < -180 || longitude > 180)
    errors.longitude = "Deve estar entre -180 e 180."
  return errors
}

export function BarForm({ onCreated }: BarFormProps) {
  const { token } = useSession()
  const [values, setValues] = React.useState({
    name: "",
    description: "",
    latitude: "",
    longitude: "",
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [locating, setLocating] = React.useState(false)

  function setField(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setFormError("Seu navegador não permite pegar a localização.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValues((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(7),
          longitude: coords.longitude.toFixed(7),
        }))
        setLocating(false)
      },
      () => {
        setFormError("Não foi possível pegar sua localização.")
        setLocating(false)
      }
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const validation = validate(values)
    setErrors(validation)
    setFormError(null)
    if (Object.keys(validation).length > 0) return

    setLoading(true)
    try {
      const bar = await api.createBar(token, {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
      })
      onCreated(bar)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors)
        setFormError(error.message)
        if (error.status === 409) setErrors({ name: error.message })
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
      <FormField id="bar-name" label="Nome" error={errors.name}>
        <Input
          id="bar-name"
          placeholder="Ex.: Porks"
          maxLength={100}
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          aria-invalid={!!errors.name}
          className="h-9"
        />
      </FormField>

      <FormField
        id="bar-description"
        label="Descrição (opcional)"
        error={errors.description}
        hint={`${values.description.length}/1000`}
      >
        <Textarea
          id="bar-description"
          placeholder="O que tem de bom por lá?"
          maxLength={1000}
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          aria-invalid={!!errors.description}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField id="bar-latitude" label="Latitude" error={errors.latitude}>
          <Input
            id="bar-latitude"
            inputMode="decimal"
            placeholder="-15.8463984"
            value={values.latitude}
            onChange={(e) => setField("latitude", e.target.value)}
            aria-invalid={!!errors.latitude}
            className="h-9"
          />
        </FormField>
        <FormField
          id="bar-longitude"
          label="Longitude"
          error={errors.longitude}
        >
          <Input
            id="bar-longitude"
            inputMode="decimal"
            placeholder="-47.9799406"
            value={values.longitude}
            onChange={(e) => setField("longitude", e.target.value)}
            aria-invalid={!!errors.longitude}
            className="h-9"
          />
        </FormField>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={useMyLocation}
        disabled={locating}
      >
        {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
        Usar minha localização
      </Button>

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
        Cadastrar bar
      </Button>
    </form>
  )
}
