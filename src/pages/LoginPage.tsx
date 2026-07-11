import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/errors'
import { verificarPrimeiroAcesso } from '../api/auth'
import { loginSchema } from '../schemas/auth.schema'
import {
  firstAccessEmailSchema,
  firstAccessPasswordSchema,
} from '../schemas/firstAccess.schema'
import { useAuth } from '../contexts/AuthContext'
import { FormField } from '../components/ui/FormField'
import { Logo } from '../components/ui/Logo'
import './LoginPage.css'

type LoginMode = 'login' | 'first-access'
type FirstAccessStep = 'email' | 'password'

export function LoginPage() {
  const { login, completeFirstAccess } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<LoginMode>('login')
  const [firstAccessStep, setFirstAccessStep] = useState<FirstAccessStep>('email')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [firstAccessName, setFirstAccessName] = useState('')

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFirstAccessName('')
    setErrors({})
    setSubmitError(null)
    setFirstAccessStep('email')
  }

  const switchToLogin = () => {
    setMode('login')
    resetForm()
  }

  const switchToFirstAccess = () => {
    setMode('first-access')
    resetForm()
  }

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const result = loginSchema.safeParse({ email, password })

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await login(result.data.email, result.data.password)
      navigate('/')
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Não foi possível entrar. Verifique se o backend está rodando.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyEmail = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const parsed = firstAccessEmailSchema.safeParse({ email })

    if (!parsed.success) {
      setErrors({ email: parsed.error.issues[0]?.message ?? 'E-mail inválido' })
      return
    }

    setIsSubmitting(true)
    try {
      const verification = await verificarPrimeiroAcesso(parsed.data.email)

      setEmail(verification.email)
      setFirstAccessName(verification.nome)
      setFirstAccessStep('password')
      setErrors({})
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Não foi possível verificar o e-mail. Tente novamente.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFirstAccessSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const result = firstAccessPasswordSchema.safeParse({
      senha: password,
      confirmarSenha: confirmPassword,
    })

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await completeFirstAccess(email, result.data.senha, result.data.confirmarSenha)
      navigate('/')
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Não foi possível definir a senha. Tente novamente.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-brand">
          <Logo variant="full" />
        </div>

        <div className="login-card">
          {mode === 'login' ? (
            <form className="login-form" onSubmit={handleLoginSubmit} noValidate>
              <h2 className="login-title">Entrar</h2>
              {submitError && <p className="form-error-banner">{submitError}</p>}
              <FormField
                label="E-mail"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                error={errors.email}
                placeholder="admin@vortex.com"
                autoComplete="email"
              />
              <FormField
                label="Senha"
                name="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, password: undefined }))
                }}
                error={errors.password}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-full"
                onClick={switchToFirstAccess}
              >
                Primeiro acesso
              </button>
            </form>
          ) : firstAccessStep === 'email' ? (
            <form className="login-form" onSubmit={handleVerifyEmail} noValidate>
              <h2 className="login-title">Primeiro acesso</h2>
              <p className="login-subtitle">
                Informe o e-mail cadastrado pela oficina para definir sua senha.
              </p>
              {submitError && <p className="form-error-banner">{submitError}</p>}
              <FormField
                label="E-mail"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                error={errors.email}
                placeholder="seu@email.com"
                autoComplete="email"
              />
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verificando...' : 'Continuar'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-full"
                onClick={switchToLogin}
              >
                Voltar ao login
              </button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleFirstAccessSubmit} noValidate>
              <h2 className="login-title">Definir senha</h2>
              <p className="login-subtitle">
                Olá, <strong>{firstAccessName}</strong>. Defina sua senha para o e-mail{' '}
                <strong>{email}</strong>.
              </p>
              {submitError && <p className="form-error-banner">{submitError}</p>}
              <FormField
                label="Senha"
                name="senha"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, senha: undefined }))
                }}
                error={errors.senha}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <FormField
                label="Confirmar senha"
                name="confirmarSenha"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, confirmarSenha: undefined }))
                }}
                error={errors.confirmarSenha}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Definir senha e entrar'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-full"
                onClick={() => {
                  setFirstAccessStep('email')
                  setPassword('')
                  setConfirmPassword('')
                  setFirstAccessName('')
                  setErrors({})
                  setSubmitError(null)
                }}
              >
                Alterar e-mail
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
