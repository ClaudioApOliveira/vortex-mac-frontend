import { z } from 'zod'
import type { ServiceOrderStatus } from '../api/types'
import { parseMoneyInput } from '../utils/masks'

export const SERVICE_ORDER_STATUSES = [
  'ORCAMENTO',
  'APROVADO',
  'EM_EXECUCAO',
  'AGUARDANDO_PECAS',
  'CONCLUIDO',
  'CANCELADO',
] as const satisfies readonly ServiceOrderStatus[]

export const serviceOrderStatusSchema = z.enum(SERVICE_ORDER_STATUSES, {
  message: 'Status é obrigatório',
})

const moneyField = (label: string, min = 0) =>
  z
    .string()
    .min(1, `${label} é obrigatório`)
    .refine((val) => Number.isFinite(parseMoneyInput(val)), {
      message: `${label} inválido`,
    })
    .refine((val) => parseMoneyInput(val) >= min, {
      message: `${label} não pode ser negativo`,
    })

const quantityField = z
  .string()
  .min(1, 'Quantidade é obrigatória')
  .refine((val) => /^\d+([.,]\d{1,2})?$/.test(val.trim()), {
    message: 'Quantidade inválida',
  })
  .refine((val) => Number(val.replace(',', '.')) > 0, {
    message: 'Quantidade deve ser maior que zero',
  })

const optionalKmField = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((val) => !val || /^\d+$/.test(val), {
    message: 'Quilometragem deve ser um número inteiro',
  })

export const serviceOrderItemSchema = z.object({
  descricao: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  quantidade: quantityField,
  valorUnitario: moneyField('Valor unitário'),
  tipo: z.enum(['PECA', 'SERVICO'], { message: 'Tipo é obrigatório' }),
})

const optionalDescriptionField = z
  .string()
  .max(500, 'Descrição deve ter no máximo 500 caracteres')
  .optional()
  .or(z.literal(''))

export const serviceOrderFormSchema = z
  .object({
    clienteId: z.string().min(1, 'Proprietário é obrigatório'),
    veiculoId: z.string().min(1, 'Veículo é obrigatório'),
    tecnicoId: z.string().min(1, 'Técnico é obrigatório'),
    data: z.string().min(1, 'Data é obrigatória'),
    hora: z.string().min(1, 'Hora é obrigatória'),
    kmEntrada: optionalKmField,
    kmSaida: optionalKmField,
    custoServicosTerceirizados: moneyField('Custo de serviços terceirizados'),
    descricaoServicosTerceirizados: optionalDescriptionField,
    custoMaoDeObra: moneyField('Custo de mão de obra'),
    descricaoMaoDeObra: optionalDescriptionField,
    status: serviceOrderStatusSchema,
    itens: z.array(serviceOrderItemSchema).min(1, 'Informe ao menos um item'),
  })
  .superRefine((data, ctx) => {
    const kmEntrada = data.kmEntrada ? Number(data.kmEntrada) : null
    const kmSaida = data.kmSaida ? Number(data.kmSaida) : null

    if (kmEntrada !== null && kmSaida !== null && kmSaida < kmEntrada) {
      ctx.addIssue({
        code: 'custom',
        path: ['kmSaida'],
        message: 'KM de saída não pode ser menor que KM de entrada',
      })
    }
  })

export type ServiceOrderItemFormData = z.infer<typeof serviceOrderItemSchema>
export type ServiceOrderFormData = z.infer<typeof serviceOrderFormSchema>

export const emptyServiceOrderItem: ServiceOrderItemFormData = {
  descricao: '',
  quantidade: '1',
  valorUnitario: '0,00',
  tipo: 'PECA',
}

export const emptyServiceOrderForm: ServiceOrderFormData = {
  clienteId: '',
  veiculoId: '',
  tecnicoId: '',
  data: new Date().toISOString().slice(0, 10),
  hora: new Date().toTimeString().slice(0, 5),
  kmEntrada: '',
  kmSaida: '',
  custoServicosTerceirizados: '0,00',
  descricaoServicosTerceirizados: '',
  custoMaoDeObra: '0,00',
  descricaoMaoDeObra: '',
  status: 'ORCAMENTO',
  itens: [{ ...emptyServiceOrderItem }],
}

export function calculateServiceOrderTotals(
  itens: ServiceOrderItemFormData[],
  custoServicosTerceirizados: string,
  custoMaoDeObra: string,
) {
  let custoPecas = 0

  for (const item of itens) {
    if (item.tipo !== 'PECA') continue
    const qty = Number(item.quantidade.replace(',', '.')) || 0
    const unit = parseMoneyInput(item.valorUnitario)
    custoPecas += qty * unit
  }

  const custoA = parseMoneyInput(custoServicosTerceirizados)
  const custoC = parseMoneyInput(custoMaoDeObra)
  const precoTotal = custoA + custoPecas + custoC

  return { custoPecas, custoMaoDeObra: custoC, precoTotal }
}

export function toServiceOrderPayload(data: ServiceOrderFormData) {
  const hora = data.hora.length === 5 ? `${data.hora}:00` : data.hora

  return {
    clienteId: Number(data.clienteId),
    veiculoId: Number(data.veiculoId),
    tecnicoId: Number(data.tecnicoId),
    data: data.data,
    hora,
    kmEntrada: data.kmEntrada ? Number(data.kmEntrada) : undefined,
    kmSaida: data.kmSaida ? Number(data.kmSaida) : undefined,
    custoServicosTerceirizados: parseMoneyInput(data.custoServicosTerceirizados),
    descricaoServicosTerceirizados: data.descricaoServicosTerceirizados?.trim() || undefined,
    custoMaoDeObra: parseMoneyInput(data.custoMaoDeObra),
    descricaoMaoDeObra: data.descricaoMaoDeObra?.trim() || undefined,
    status: data.status,
    itens: data.itens.map((item) => ({
      descricao: item.descricao.trim(),
      quantidade: Number(item.quantidade.replace(',', '.')),
      valorUnitario: parseMoneyInput(item.valorUnitario),
      tipo: item.tipo,
    })),
  }
}
