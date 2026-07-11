import { z } from 'zod'

export const firstAccessEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Informe um e-mail válido'),
})

export const firstAccessPasswordSchema = z
  .object({
    senha: z
      .string()
      .min(1, 'Senha é obrigatória')
      .min(6, 'A senha deve ter no mínimo 6 caracteres')
      .max(100, 'A senha deve ter no máximo 100 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirme a senha'),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: 'As senhas não conferem',
    path: ['confirmarSenha'],
  })

export type FirstAccessEmailData = z.infer<typeof firstAccessEmailSchema>
export type FirstAccessPasswordData = z.infer<typeof firstAccessPasswordSchema>
