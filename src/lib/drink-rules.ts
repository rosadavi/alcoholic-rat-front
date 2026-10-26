// regras de volume e teor alcoolico iguais as do DrinkRequestDTO e PostDrinkRequestDTO
export const MAX_VOLUME_ML = 5000

export function volumeError(value: string): string | undefined {
  const volume = Number(value)
  if (!value.trim() || Number.isNaN(volume)) return "Informe o volume em ml."
  if (!Number.isInteger(volume)) return "Use um número inteiro de ml."
  if (volume <= 0 || volume > MAX_VOLUME_ML)
    return `Deve ser maior que 0 e até ${MAX_VOLUME_ML} ml.`
}

export function percentageError(value: string): string | undefined {
  const percentage = Number(value.replace(",", "."))
  if (!value.trim() || Number.isNaN(percentage))
    return "Informe o teor alcoólico."
  if (percentage < 0 || percentage > 100) return "Deve estar entre 0 e 100%."
}

export function parsePercentage(value: string) {
  return Number(value.replace(",", "."))
}

export function formatVolume(volumeMl: number) {
  return volumeMl >= 1000
    ? `${(volumeMl / 1000).toLocaleString("pt-BR")} L`
    : `${volumeMl} ml`
}

export function formatPercentage(percentage: number) {
  return `${Number(percentage).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
}
