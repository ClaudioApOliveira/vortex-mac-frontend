import { z } from 'zod'

export const updateProfileSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(3, 'O nome deve ter no mínimo 3 caracteres')
    .max(150, 'O nome deve ter no máximo 150 caracteres'),
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Informe um e-mail válido')
    .max(150, 'O e-mail deve ter no máximo 150 caracteres'),
})

export const changePasswordSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
    novaSenha: z
      .string()
      .min(1, 'Nova senha é obrigatória')
      .min(6, 'A senha deve ter no mínimo 6 caracteres')
      .max(100, 'A senha deve ter no máximo 100 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: 'As senhas não conferem',
    path: ['confirmarSenha'],
  })
  .refine((data) => data.novaSenha !== data.senhaAtual, {
    message: 'A nova senha deve ser diferente da senha atual',
    path: ['novaSenha'],
  })

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
