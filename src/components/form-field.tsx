import * as React from "react"

import { Label } from "@/components/ui/label"

type FormFieldProps = {
  id: string
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}

export function FormField({
  id,
  label,
  error,
  hint,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
