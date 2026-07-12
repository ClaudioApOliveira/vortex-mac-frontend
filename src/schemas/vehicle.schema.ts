import { z } from 'zod'
import { parseAnoFabModelo } from '../utils/masks'

const placaRegex = /^[A-Z]{3}-?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/
const ANO_MIN = 1900
export const ANO_VEICULO_MAX = new Date().getFullYear()

function validateAnoFabModelo(value: string): string | null {
  if (!/^\d{4}\/\d{4}$/.test(value)) {
    return 'Informe fabricação e modelo no formato AAAA/AAAA (ex: 2025/2026)'
  }

  const { anoFabricacao, anoModelo } = parseAnoFabModelo(value)

  if (!Number.isInteger(anoFabricacao) || !Number.isInteger(anoModelo)) {
    return 'Ano de fabricação ou modelo inválido'
  }

  if (anoFabricacao < ANO_MIN) {
    return `Ano de fabricação deve ser a partir de ${ANO_MIN}`
  }

  if (anoFabricacao > ANO_VEICULO_MAX) {
    return `Ano de fabricação não pode ser maior que ${ANO_VEICULO_MAX}`
  }

  if (anoModelo < anoFabricacao) {
    return 'Ano de modelo não pode ser anterior ao de fabricação'
  }

  if (anoModelo > anoFabricacao + 1) {
    return 'Ano de modelo deve ser igual ou um ano após o de fabricação'
  }

  return null
}

const optionalText = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label} deve ter no máximo ${max} caracteres`)
    .optional()
    .or(z.literal(''))

export const vehicleFormInputSchema = z.object({
  placa: z
    .string()
    .min(1, 'Placa é obrigatória')
    .max(10, 'Placa deve ter no máximo 10 caracteres')
    .refine((val) => placaRegex.test(val.replace(/[^A-Z0-9]/gi, '').toUpperCase()), {
      message: 'Placa inválida (ex: ABC-1234 ou ABC1D23)',
    }),
  marca: z
    .string()
    .min(1, 'Marca é obrigatória')
    .max(80, 'Marca deve ter no máximo 80 caracteres'),
  modelo: z
    .string()
    .min(1, 'Modelo é obrigatório')
    .max(120, 'Modelo deve ter no máximo 120 caracteres'),
  anoFabricacao: z
    .string()
    .min(1, 'Ano de fabricação / modelo é obrigatório')
    .superRefine((val, ctx) => {
      const error = validateAnoFabModelo(val)
      if (error) {
        ctx.addIssue({ code: 'custom', message: error })
      }
    }),
  motor: optionalText(30, 'Motor'),
  combustivel: optionalText(30, 'Combustível'),
  kmAtual: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || /^\d+$/.test(val), {
      message: 'Quilometragem deve ser um número inteiro',
    }),
})

export const vehicleSchema = vehicleFormInputSchema.extend({
  clienteId: z.number({ error: 'Cliente é obrigatório' }).positive('Cliente é obrigatório'),
})

export type VehicleFormData = z.infer<typeof vehicleFormInputSchema>

export const emptyVehicleForm: VehicleFormData = {
  placa: '',
  marca: '',
  modelo: '',
  anoFabricacao: '',
  motor: '',
  combustivel: '',
  kmAtual: '',
}

export function toVehiclePayload(clienteId: number, data: VehicleFormData) {
  return {
    clienteId,
    placa: data.placa,
    marca: data.marca.trim(),
    modelo: data.modelo.trim(),
    anoFabricacao: parseAnoFabModelo(data.anoFabricacao).anoFabricacao,
    motor: data.motor?.trim() || undefined,
    combustivel: data.combustivel?.trim() || undefined,
    kmAtual: data.kmAtual ? Number(data.kmAtual) : undefined,
  }
}
