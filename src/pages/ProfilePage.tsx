import { useEffect, useState, type FormEvent } from 'react'
import {
  changeCurrentUserPassword,
  updateCurrentUserProfile,
} from '../api/auth'
import { ApiError } from '../api/errors'
import { UserProfileBadge } from '../components/users/UserFormModal'
import '../components/users/UserFormModal.css'
import { FormField } from '../components/ui/FormField'
import { useAuth } from '../contexts/AuthContext'
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordFormData,
  type UpdateProfileFormData,
} from '../schemas/profile.schema'
import { mapZodErrors } from '../utils/mapZodErrors'
import './ProfilePage.css'

const emptyPasswordForm: ChangePasswordFormData = {
  senhaAtual: '',
  novaSenha: '',
  confirmarSenha: '',
}

type ProfileErrors = Partial<Record<keyof UpdateProfileFormData, string>>
type PasswordErrors = Partial<Record<keyof ChangePasswordFormData, string>>

export function ProfilePage() {
  const { user, syncUser } = useAuth()
  const [profileForm, setProfileForm] = useState<UpdateProfileFormData>({
    nome: '',
    email: '',
  })
  const [passwordForm, setPasswordForm] =
    useState<ChangePasswordFormData>(emptyPasswordForm)
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({})
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({})
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    if (!user) return

    setProfileForm({
      nome: user.nome,
      email: user.email,
    })
  }, [user])

  const updateProfileField = <K extends keyof UpdateProfileFormData>(
    field: K,
    value: UpdateProfileFormData[K],
  ) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }))
    setProfileErrors((prev) => ({ ...prev, [field]: undefined }))
    setProfileError(null)
    setProfileSuccess(null)
  }

  const updatePasswordField = <K extends keyof ChangePasswordFormData>(
    field: K,
    value: ChangePasswordFormData[K],
  ) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
    setPasswordErrors((prev) => ({ ...prev, [field]: undefined }))
    setPasswordError(null)
    setPasswordSuccess(null)
  }

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setProfileError(null)
    setProfileSuccess(null)

    const result = updateProfileSchema.safeParse(profileForm)
    if (!result.success) {
      setProfileErrors(mapZodErrors(result.error))
      return
    }

    setIsSavingProfile(true)

    try {
      const updated = await updateCurrentUserProfile(result.data)
      syncUser(updated)
      setProfileSuccess('Perfil atualizado com sucesso.')
    } catch (error) {
      setProfileError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível atualizar o perfil.',
      )
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    const result = changePasswordSchema.safeParse(passwordForm)
    if (!result.success) {
      setPasswordErrors(mapZodErrors(result.error))
      return
    }

    setIsSavingPassword(true)

    try {
      await changeCurrentUserPassword(result.data)
      setPasswordForm(emptyPasswordForm)
      setPasswordErrors({})
      setPasswordSuccess('Senha alterada com sucesso. Sua sessão foi renovada.')
    } catch (error) {
      setPasswordError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível alterar a senha.',
      )
    } finally {
      setIsSavingPassword(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Meu perfil</h1>
          <p className="page-subtitle">
            Atualize seus dados pessoais e altere sua senha de acesso
          </p>
        </div>
      </header>

      <div className="profile-grid">
        <section className="profile-card">
          <h2>Dados pessoais</h2>
          <p className="profile-card-description">
            Você pode alterar seu nome e e-mail. Perfil e vínculos são
            gerenciados pelo administrador.
          </p>

          {profileSuccess && (
            <p className="profile-success-banner">{profileSuccess}</p>
          )}
          {profileError && <p className="page-error-banner">{profileError}</p>}

          <form className="profile-form" onSubmit={handleProfileSubmit} noValidate>
            <FormField
              label="Nome"
              name="nome"
              value={profileForm.nome}
              onChange={(event) => updateProfileField('nome', event.target.value)}
              error={profileErrors.nome}
              placeholder="Seu nome completo"
            />
            <FormField
              label="E-mail"
              name="email"
              type="email"
              value={profileForm.email}
              onChange={(event) => updateProfileField('email', event.target.value)}
              error={profileErrors.email}
              placeholder="seu@email.com"
            />

            <div className="profile-readonly">
              <label>Perfil de acesso</label>
              <UserProfileBadge perfil={user.perfil} />
            </div>

            <div className="profile-form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </section>

        <section className="profile-card">
          <h2>Alterar senha</h2>
          <p className="profile-card-description">
            Informe a senha atual e defina uma nova senha. Após a alteração, sua
            sessão será renovada automaticamente.
          </p>

          {passwordSuccess && (
            <p className="profile-success-banner">{passwordSuccess}</p>
          )}
          {passwordError && <p className="page-error-banner">{passwordError}</p>}

          <form className="profile-form" onSubmit={handlePasswordSubmit} noValidate>
            <FormField
              label="Senha atual"
              name="senhaAtual"
              type="password"
              value={passwordForm.senhaAtual}
              onChange={(event) =>
                updatePasswordField('senhaAtual', event.target.value)
              }
              error={passwordErrors.senhaAtual}
              autoComplete="current-password"
            />
            <FormField
              label="Nova senha"
              name="novaSenha"
              type="password"
              value={passwordForm.novaSenha}
              onChange={(event) =>
                updatePasswordField('novaSenha', event.target.value)
              }
              error={passwordErrors.novaSenha}
              autoComplete="new-password"
            />
            <FormField
              label="Confirmar nova senha"
              name="confirmarSenha"
              type="password"
              value={passwordForm.confirmarSenha}
              onChange={(event) =>
                updatePasswordField('confirmarSenha', event.target.value)
              }
              error={passwordErrors.confirmarSenha}
              autoComplete="new-password"
            />

            <div className="profile-form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSavingPassword}
              >
                {isSavingPassword ? 'Alterando...' : 'Alterar senha'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
