export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function formatPlaca(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7)

  if (cleaned.length <= 3) return cleaned

  const isMercosul = /^[A-Z]{3}\d[A-Z]/.test(cleaned)
  if (isMercosul) return cleaned

  if (cleaned.length <= 7) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  }

  return cleaned
}

export function displayPlaca(placa: string) {
  const cleaned = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(cleaned)) return cleaned
  if (/^[A-Z]{3}\d{4}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  }
  return cleaned
}

export function formatCpfCnpj(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)

  if (digits.length <= 11) {
    if (digits.length <= 3) return digits
    if (digits.length <= 6) {
      return `${digits.slice(0, 3)}.${digits.slice(3)}`
    }
    if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

/** Formata valor monetário enquanto digita (centavos → 1.234,56). */
export function formatMoneyInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 12)
  if (!digits) return ''

  const amount = Number(digits) / 100
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatMoneyFromNumber(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function parseMoneyInput(value: string) {
  if (!value.trim()) return 0
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}
