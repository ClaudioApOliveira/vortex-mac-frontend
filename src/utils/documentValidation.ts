/** Validação de CPF (numérico) e CNPJ (numérico ou alfanumérico RFB). */

function apenasDigitos(value: string) {
  return value.replace(/\D/g, '')
}

function normalizarCnpjAlfanumerico(value: string) {
  return value.replace(/[./\-\s]/g, '').toUpperCase()
}

function valorCaractereCnpj(char: string) {
  const code = char.charCodeAt(0)
  if (code >= 48 && code <= 57) return code - 48
  if (code >= 65 && code <= 90) return code - 65 + 17
  return -1
}

function calcularDigitoCpf(digits: string, length: number) {
  let soma = 0
  let peso = length + 1
  for (let i = 0; i < length; i++) {
    soma += Number(digits[i]) * peso--
  }
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

function calcularDigitoCnpj(texto: string) {
  let soma = 0
  let peso = 2
  for (let i = texto.length - 1; i >= 0; i--) {
    const valor = valorCaractereCnpj(texto[i]!)
    if (valor < 0) return -1
    soma += valor * peso
    peso = peso === 9 ? 2 : peso + 1
  }
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

export function isCpfValid(cpf: string) {
  const digits = apenasDigitos(cpf)
  if (!/^\d{11}$/.test(digits)) return false
  if (/^(\d)\1{10}$/.test(digits)) return false
  return (
    calcularDigitoCpf(digits, 9) === Number(digits[9]) &&
    calcularDigitoCpf(digits, 10) === Number(digits[10])
  )
}

export function isCnpjValid(cnpj: string) {
  const base = normalizarCnpjAlfanumerico(cnpj)
  if (!/^[0-9A-Z]{12}\d{2}$/.test(base)) return false
  if (/^([0-9A-Z])\1{13}$/.test(base)) return false
  const corpo = base.slice(0, 12)
  const dv1 = calcularDigitoCnpj(corpo)
  const dv2 = calcularDigitoCnpj(corpo + String(dv1))
  return dv1 === Number(base[12]) && dv2 === Number(base[13])
}

export function isCpfOrCnpjValid(value: string) {
  const alnum = normalizarCnpjAlfanumerico(value)
  if (alnum.length <= 11) return isCpfValid(value)
  return isCnpjValid(value)
}

export function isCepValid(cep: string) {
  return apenasDigitos(cep).length === 8
}

export function isPlacaValid(placa: string) {
  const cleaned = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  return /^[A-Z]{3}\d{4}$/.test(cleaned) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(cleaned)
}
