import { z } from 'zod'

const placaRegex = /^[A-Z]{3}-?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/

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
    .min(1, 'Ano de fabricação é obrigatório')
    .refine((val) => /^\d{4}$/.test(val), { message: 'Informe o ano com 4 dígitos' })
    .refine((val) => {
      const year = Number(val)
      return year >= 1900 && year <= 2100
    }, { message: 'Ano de fabricação inválido' }),
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
    anoFabricacao: Number(data.anoFabricacao),
    motor: data.motor?.trim() || undefined,
    combustivel: data.combustivel?.trim() || undefined,
    kmAtual: data.kmAtual ? Number(data.kmAtual) : undefined,
  }
}
