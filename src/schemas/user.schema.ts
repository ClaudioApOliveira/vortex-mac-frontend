import { z } from 'zod'

const profileEnum = z.enum(['ADMIN', 'TECNICO', 'CLIENTE'])

const baseUserFields = {
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Informe um e-mail válido')
    .max(150, 'O e-mail deve ter no máximo 150 caracteres'),
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(3, 'O nome deve ter no mínimo 3 caracteres')
    .max(150, 'O nome deve ter no máximo 150 caracteres'),
  perfil: profileEnum,
  clienteId: z.string().optional(),
  ativo: z.boolean(),
}

function withProfileRules<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data, ctx) => {
    const value = data as {
      perfil: z.infer<typeof profileEnum>
      clienteId?: string
    }

    if (value.perfil === 'CLIENTE' && !value.clienteId?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['clienteId'],
        message: 'Cliente vinculado é obrigatório para perfil CLIENTE',
      })
    }
  })
}

export const createUserSchema = withProfileRules(
  z.object({
    ...baseUserFields,
    senha: z
      .string()
      .min(1, 'Senha é obrigatória')
      .min(6, 'A senha deve ter no mínimo 6 caracteres')
      .max(100, 'A senha deve ter no máximo 100 caracteres'),
  }),
)

export const editUserSchema = withProfileRules(
  z.object({
    ...baseUserFields,
    senha: z
      .string()
      .max(100, 'A senha deve ter no máximo 100 caracteres')
      .optional(),
  }).superRefine((data, ctx) => {
    if (data.senha && data.senha.length > 0 && data.senha.length < 6) {
      ctx.addIssue({
        code: 'custom',
        path: ['senha'],
        message: 'A senha deve ter no mínimo 6 caracteres',
      })
    }
  }),
)

export type UserFormData = z.infer<typeof createUserSchema>
