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
import { ROUTES } from '../routes/paths'
import {
  FIRST_ACCESS_INELIGIBLE_MESSAGE,
  getFirstAccessErrorMessage,
  getLoginErrorMessage,
} from '../utils/apiMessages'
import { mapZodErrors } from '../utils/mapZodErrors'
import { FormField } from '../components/ui/FormField'
import { PasswordField } from '../components/ui/PasswordField'
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
      setErrors(mapZodErrors(result.error))
      return
    }

    setIsSubmitting(true)
    try {
      await login(result.data.email, result.data.password)
      navigate(ROUTES.home)
    } catch (error) {
      setSubmitError(getLoginErrorMessage(error))
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
      if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
        setSubmitError(FIRST_ACCESS_INELIGIBLE_MESSAGE)
      } else {
        setSubmitError(getFirstAccessErrorMessage(error))
      }
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
      setErrors(mapZodErrors(result.error))
      return
    }

    setIsSubmitting(true)
    try {
      await completeFirstAccess(email, result.data.senha, result.data.confirmarSenha)
      navigate(ROUTES.home)
    } catch (error) {
      setSubmitError(getFirstAccessErrorMessage(error))
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
              <header className="login-header">
                <h2 className="login-title">Entrar</h2>
                <p className="login-subtitle">
                  Acesse o painel de gestão da sua oficina.
                </p>
              </header>
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
                autoFocus
              />
              <PasswordField
                label="Senha"
                name="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, password: undefined }))
                }}
                error={errors.password}
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
              <p className="login-switch">
                É seu primeiro acesso?{' '}
                <button
                  type="button"
                  className="login-link"
                  onClick={switchToFirstAccess}
                >
                  Definir senha
                </button>
              </p>
            </form>
          ) : firstAccessStep === 'email' ? (
            <form className="login-form" onSubmit={handleVerifyEmail} noValidate>
              <header className="login-header">
                <h2 className="login-title">Primeiro acesso</h2>
                <p className="login-subtitle">
                  Informe o e-mail cadastrado pela oficina para definir sua senha.
                </p>
              </header>
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
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verificando...' : 'Continuar'}
              </button>
              <p className="login-switch">
                <button
                  type="button"
                  className="login-link"
                  onClick={switchToLogin}
                >
                  Voltar ao login
                </button>
              </p>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleFirstAccessSubmit} noValidate>
              <header className="login-header">
                <h2 className="login-title">Definir senha</h2>
                <p className="login-subtitle">
                  Olá, <strong>{firstAccessName}</strong>. Defina sua senha para o e-mail{' '}
                  <strong>{email}</strong>.
                </p>
              </header>
              {submitError && <p className="form-error-banner">{submitError}</p>}
              <PasswordField
                label="Senha"
                name="senha"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, senha: undefined }))
                }}
                error={errors.senha}
                placeholder="Mínimo de 6 caracteres"
                autoComplete="new-password"
              />
              <PasswordField
                label="Confirmar senha"
                name="confirmarSenha"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, confirmarSenha: undefined }))
                }}
                error={errors.confirmarSenha}
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Definir senha e entrar'}
              </button>
              <p className="login-switch">
                <button
                  type="button"
                  className="login-link"
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
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
