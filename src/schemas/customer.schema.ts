import { z } from 'zod'

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/
const cepRegex = /^\d{5}-?\d{3}$/

const optionalText = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label} deve ter no máximo ${max} caracteres`)
    .optional()

export const customerSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome do proprietário é obrigatório')
    .min(3, 'O nome deve ter no mínimo 3 caracteres')
    .max(150, 'O nome deve ter no máximo 150 caracteres'),
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Informe um e-mail válido')
    .max(150, 'O e-mail deve ter no máximo 150 caracteres'),
  cpf: z
    .string()
    .optional()
    .refine((val) => !val || cpfRegex.test(val) || cnpjRegex.test(val), {
      message: 'CPF/CNPJ inválido',
    }),
  telefone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(phoneRegex, 'Telefone inválido (ex: (11) 99999-9999)')
    .max(20, 'O telefone deve ter no máximo 20 caracteres'),
  cep: z
    .string()
    .min(1, 'CEP é obrigatório')
    .max(9, 'CEP deve ter no máximo 9 caracteres')
    .regex(cepRegex, 'CEP inválido (ex: 01310-100)'),
  logradouro: optionalText(255, 'Logradouro'),
  complemento: optionalText(255, 'Complemento'),
  numero: optionalText(20, 'Número'),
  bairro: optionalText(150, 'Bairro'),
  cidade: optionalText(150, 'Cidade').refine((val) => !!val?.trim(), {
    message: 'Cidade é obrigatória',
  }),
  uf: z
    .string()
    .min(1, 'UF é obrigatória')
    .length(2, 'UF inválida'),
  estado: optionalText(100, 'Estado'),
  ibge: optionalText(10, 'IBGE'),
})

export type CustomerFormData = z.infer<typeof customerSchema>
