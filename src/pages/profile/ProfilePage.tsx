import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  acceptLgpdPolicy,
  changeCurrentUserPassword,
  exportMyPersonalData,
  requestPersonalDataDeletion,
  updateCurrentUserProfile,
} from '../../api/auth'
import { ApiError } from '../../api/errors'
import { UserProfileBadge } from '../../components/users/UserFormModal'
import '../../components/users/UserFormModal.css'
import { FormField } from '../../components/ui/FormField'
import { LGPD_POLICY_VERSION } from '../../constants/lgpd'
import { useAuth } from '../../contexts/AuthContext'
import { useConfirmDialog } from '../../hooks/useConfirmDialog'
import { ROUTES } from '../../routes/paths'
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordFormData,
  type UpdateProfileFormData,
} from '../../schemas/profile.schema'
import { mapZodErrors } from '../../utils/mapZodErrors'
import { formatDateTime } from '../../utils/serviceOrder'
import { canAccessLgpdPrivacy } from '../../utils/permissions'
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
  const { confirm, ConfirmDialog } = useConfirmDialog()
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
  const [privacyError, setPrivacyError] = useState<string | null>(null)
  const [privacySuccess, setPrivacySuccess] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isPrivacyBusy, setIsPrivacyBusy] = useState(false)

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

  const handleExportData = async () => {
    setPrivacyError(null)
    setPrivacySuccess(null)
    setIsPrivacyBusy(true)
    try {
      const data = await exportMyPersonalData()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `meus-dados-lgpd-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      setPrivacySuccess('Arquivo com seus dados baixado com sucesso.')
    } catch (error) {
      setPrivacyError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível exportar seus dados.',
      )
    } finally {
      setIsPrivacyBusy(false)
    }
  }

  const handleAcceptLgpd = async () => {
    setPrivacyError(null)
    setPrivacySuccess(null)
    setIsPrivacyBusy(true)
    try {
      const updated = await acceptLgpdPolicy(LGPD_POLICY_VERSION)
      syncUser(updated)
      setPrivacySuccess('Aceite da Política de Privacidade registrado.')
    } catch (error) {
      setPrivacyError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível registrar o aceite.',
      )
    } finally {
      setIsPrivacyBusy(false)
    }
  }

  const handleRequestDeletion = async () => {
    const confirmed = await confirm({
      title: 'Solicitar exclusão de dados',
      message:
        'A oficina receberá seu pedido. Quando não for possível apagar o histórico de OS, os dados pessoais poderão ser anonimizados.',
      confirmLabel: 'Solicitar exclusão',
      variant: 'danger',
    })
    if (!confirmed) return

    setPrivacyError(null)
    setPrivacySuccess(null)
    setIsPrivacyBusy(true)
    try {
      const updated = await requestPersonalDataDeletion()
      syncUser(updated)
      setPrivacySuccess(
        'Solicitação registrada. A oficina irá analisar e concluir o pedido.',
      )
    } catch (error) {
      setPrivacyError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível registrar a solicitação.',
      )
    } finally {
      setIsPrivacyBusy(false)
    }
  }

  if (!user) {
    return null
  }

  const needsLgpdAccept =
    !user.lgpdAceiteEm || user.lgpdAceiteVersao !== LGPD_POLICY_VERSION
  const deletionRequested = Boolean(user.lgpdExclusaoSolicitadaEm)
  const anonymized = Boolean(user.lgpdAnonimizadoEm)
  const showLgpdPrivacy = canAccessLgpdPrivacy(user)

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
                disabled={isSavingProfile || anonymized}
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
                disabled={isSavingPassword || anonymized}
              >
                {isSavingPassword ? 'Alterando...' : 'Alterar senha'}
              </button>
            </div>
          </form>
        </section>

        {showLgpdPrivacy && (
        <section className="profile-card profile-card--wide">
          <h2>Privacidade (LGPD)</h2>
          <p className="profile-card-description">
            Consulte a política, exporte seus dados ou solicite exclusão/anonimização.
          </p>

          {privacySuccess && (
            <p className="profile-success-banner">{privacySuccess}</p>
          )}
          {privacyError && <p className="page-error-banner">{privacyError}</p>}

          <ul className="profile-privacy-meta">
            <li>
              Política:{' '}
              <Link to={ROUTES.privacy} className="login-link">
                ver texto completo (v{LGPD_POLICY_VERSION})
              </Link>
            </li>
            <li>
              Aceite:{' '}
              {user.lgpdAceiteEm
                ? `${formatDateTime(user.lgpdAceiteEm)} · v${user.lgpdAceiteVersao ?? '—'}`
                : 'ainda não registrado'}
            </li>
            {deletionRequested && (
              <li>
                Exclusão solicitada em {formatDateTime(user.lgpdExclusaoSolicitadaEm!)}
              </li>
            )}
            {anonymized && (
              <li>Dados anonimizados em {formatDateTime(user.lgpdAnonimizadoEm!)}</li>
            )}
          </ul>

          <div className="profile-form-actions profile-privacy-actions">
            {needsLgpdAccept && !anonymized && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={isPrivacyBusy}
                onClick={() => void handleAcceptLgpd()}
              >
                Aceitar política v{LGPD_POLICY_VERSION}
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isPrivacyBusy}
              onClick={() => void handleExportData()}
            >
              {isPrivacyBusy ? 'Processando...' : 'Exportar meus dados'}
            </button>
            {!anonymized && (
              <button
                type="button"
                className="btn btn-danger"
                disabled={isPrivacyBusy || deletionRequested}
                onClick={() => void handleRequestDeletion()}
              >
                {deletionRequested ? 'Exclusão já solicitada' : 'Solicitar exclusão'}
              </button>
            )}
          </div>
        </section>
        )}
      </div>

      <ConfirmDialog />
    </div>
  )
}
