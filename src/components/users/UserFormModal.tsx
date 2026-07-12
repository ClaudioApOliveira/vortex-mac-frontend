import { useEffect, useState, type FormEvent } from 'react'
import {
  createUserSchema,
  editUserSchema,
  type UserFormData,
} from '../../schemas/user.schema'
import type { Customer, SystemUser } from '../../types'
import { getProfileLabel } from '../../utils/permissions'
import { mapZodErrors } from '../../utils/mapZodErrors'
import { FormField } from '../ui/FormField'
import { Modal } from '../ui/Modal'
import '../ui/FormModal.css'
import './UserFormModal.css'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: UserFormData) => Promise<void>
  isSubmitting?: boolean
  user?: SystemUser | null
  customers: Customer[]
}

const emptyForm: UserFormData = {
  email: '',
  senha: '',
  nome: '',
  perfil: 'TECNICO',
  clienteId: '',
  ativo: true,
}

type FormErrors = Partial<Record<keyof UserFormData, string>>

function toFormData(user: SystemUser): UserFormData {
  return {
    email: user.email,
    senha: '',
    nome: user.nome,
    perfil: user.perfil,
    clienteId: user.clienteId ? String(user.clienteId) : '',
    ativo: user.ativo,
  }
}

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  user = null,
  customers,
}: UserFormModalProps) {
  const isEditing = user !== null
  const [form, setForm] = useState<UserFormData>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (!isOpen) return
    setForm(user ? toFormData(user) : emptyForm)
    setErrors({})
  }, [isOpen, user])

  const handleClose = () => {
    if (isSubmitting) return
    setForm(emptyForm)
    setErrors({})
    onClose()
  }

  const updateField = <K extends keyof UserFormData>(
    field: K,
    value: UserFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const schema = isEditing ? editUserSchema : createUserSchema
    const result = schema.safeParse(form)

    if (!result.success) {
      setErrors(mapZodErrors(result.error))
      return
    }

    await onSubmit({
      ...result.data,
      senha: result.data.senha ?? '',
    })
    setForm(emptyForm)
    setErrors({})
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Usuário' : 'Cadastrar Usuário'}
      description="Defina o perfil de acesso e as credenciais do usuário no sistema."
      preventClose={isSubmitting}
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="user-form"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Usuário'}
          </button>
        </>
      }
    >
      <form id="user-form" className="modal-form" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Nome"
          name="nome"
          value={form.nome}
          onChange={(e) => updateField('nome', e.target.value)}
          error={errors.nome}
          placeholder="Nome completo"
        />
        <FormField
          label="E-mail"
          name="email"
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          error={errors.email}
          placeholder="usuario@vortex.com"
        />
        <FormField
          label={isEditing ? 'Nova senha (opcional)' : 'Senha'}
          name="senha"
          type="password"
          value={form.senha ?? ''}
          onChange={(e) => updateField('senha', e.target.value)}
          error={errors.senha}
          placeholder={isEditing ? 'Deixe em branco para manter' : '••••••••'}
        />

        <div className="form-field">
          <label htmlFor="perfil">Perfil</label>
          <select
            id="perfil"
            name="perfil"
            className={errors.perfil ? 'input-error' : ''}
            value={form.perfil}
            onChange={(e) =>
              updateField('perfil', e.target.value as UserFormData['perfil'])
            }
          >
            <option value="ADMIN">Administrador</option>
            <option value="TECNICO">Técnico</option>
            <option value="CLIENTE">Cliente</option>
          </select>
          {errors.perfil && <span className="field-error">{errors.perfil}</span>}
        </div>

        {form.perfil === 'CLIENTE' && (
          <div className="form-field">
            <label htmlFor="clienteId">Cliente vinculado</label>
            <select
              id="clienteId"
              name="clienteId"
              className={errors.clienteId ? 'input-error' : ''}
              value={form.clienteId ?? ''}
              onChange={(e) => updateField('clienteId', e.target.value)}
            >
              <option value="">Selecione um cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.nome}
                </option>
              ))}
            </select>
            {errors.clienteId && (
              <span className="field-error">{errors.clienteId}</span>
            )}
          </div>
        )}

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={form.ativo}
            onChange={(e) => updateField('ativo', e.target.checked)}
          />
          Usuário ativo
        </label>
      </form>
    </Modal>
  )
}

export function UserProfileBadge({ perfil }: { perfil: SystemUser['perfil'] }) {
  return <span className="profile-badge">{getProfileLabel(perfil)}</span>
}
