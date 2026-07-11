import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../api/errors'
import { fetchMunicipiosByUf } from '../../api/localidades'
import type { MunicipioResponse } from '../../api/types'
import { customerSchema, type CustomerFormData } from '../../schemas/customer.schema'
import {
  emptyVehicleForm,
  vehicleFormInputSchema,
  type VehicleFormData,
} from '../../schemas/vehicle.schema'
import type { Customer } from '../../types'
import { fetchAddressByCep, findMunicipio, formatCep } from '../../utils/address'
import { BRAZILIAN_STATES, getStateName } from '../../utils/brazilianStates'
import { formatCpfCnpj, formatPhone } from '../../utils/masks'
import { FormField } from '../ui/FormField'
import { Modal } from '../ui/Modal'
import { VehicleFormFields } from '../vehicles/VehicleFormFields'
import '../ui/FormModal.css'
import './CustomerFormModal.css'
import '../vehicles/VehicleFormFields.css'

interface CustomerFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CustomerFormData, vehicle?: VehicleFormData) => Promise<void>
  isSubmitting?: boolean
  customer?: Customer | null
}

const emptyForm: CustomerFormData = {
  nome: '',
  email: '',
  cpf: '',
  telefone: '',
  cep: '',
  logradouro: '',
  complemento: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: '',
  estado: '',
  ibge: '',
}

type FormErrors = Partial<Record<keyof CustomerFormData, string>>
type VehicleErrors = Partial<Record<keyof VehicleFormData, string>>

function mapZodErrors(
  error: ReturnType<typeof customerSchema.safeParse>['error'],
): FormErrors {
  const errors: FormErrors = {}
  if (!error) return errors

  for (const issue of error.issues) {
    const path = issue.path[0] as keyof CustomerFormData
    if (!errors[path]) {
      errors[path] = issue.message
    }
  }
  return errors
}

function toFormData(customer: Customer): CustomerFormData {
  return {
    nome: customer.nome,
    email: customer.email ?? '',
    cpf: customer.cpf ? formatCpfCnpj(customer.cpf) : '',
    telefone: customer.telefone ? formatPhone(customer.telefone) : '',
    cep: customer.cep ?? '',
    logradouro: customer.logradouro ?? '',
    complemento: customer.complemento ?? '',
    numero: customer.numero ?? '',
    bairro: customer.bairro ?? '',
    cidade: customer.cidade ?? '',
    uf: customer.uf ?? '',
    estado: customer.estado ?? '',
    ibge: customer.ibge ?? '',
  }
}

export function CustomerFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  customer = null,
}: CustomerFormModalProps) {
  const isEditing = customer !== null
  const [form, setForm] = useState<CustomerFormData>(emptyForm)
  const [includeVehicle, setIncludeVehicle] = useState(false)
  const [vehicleForm, setVehicleForm] = useState<VehicleFormData>(emptyVehicleForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [vehicleErrors, setVehicleErrors] = useState<VehicleErrors>({})
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const [cepMessage, setCepMessage] = useState<string | null>(null)
  const [municipios, setMunicipios] = useState<MunicipioResponse[]>([])
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false)
  const [municipioMessage, setMunicipioMessage] = useState<string | null>(null)
  const [isAddressFromCep, setIsAddressFromCep] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setForm(customer ? toFormData(customer) : emptyForm)
    setIncludeVehicle(false)
    setVehicleForm(emptyVehicleForm)
    setErrors({})
    setVehicleErrors({})
    setCepMessage(null)
    setMunicipioMessage(null)
    setIsAddressFromCep(false)
  }, [isOpen, customer])

  useEffect(() => {
    if (!isOpen) return

    const uf = form.uf?.trim().toUpperCase()
    if (!uf || uf.length !== 2) {
      setMunicipios([])
      return
    }

    let cancelled = false
    setIsLoadingMunicipios(true)
    setMunicipioMessage(null)

    fetchMunicipiosByUf(uf)
      .then((data) => {
        if (cancelled) return
        setMunicipios(data)
      })
      .catch((error) => {
        if (cancelled) return
        setMunicipios([])
        setMunicipioMessage(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar os municípios.',
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMunicipios(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, form.uf])

  useEffect(() => {
    if (municipios.length === 0) return
    if (!form.cidade?.trim() && !form.ibge?.trim()) return

    const matched = findMunicipio(municipios, form.cidade, form.ibge)
    if (!matched) return

    const matchedIbge = String(matched.id)
    if (form.ibge === matchedIbge && form.cidade === matched.nome) return

    setForm((prev) => ({
      ...prev,
      ibge: matchedIbge,
      cidade: matched.nome,
      estado: getStateName(matched.uf) ?? prev.estado,
    }))
  }, [municipios, form.cidade, form.ibge])

  const handleClose = () => {
    if (isSubmitting) return
    setForm(emptyForm)
    setIncludeVehicle(false)
    setVehicleForm(emptyVehicleForm)
    setErrors({})
    setVehicleErrors({})
    setCepMessage(null)
    setMunicipioMessage(null)
    setMunicipios([])
    setIsAddressFromCep(false)
    onClose()
  }

  const updateField = <K extends keyof CustomerFormData>(
    field: K,
    value: CustomerFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleCepBlur = async () => {
    const digits = form.cep.replace(/\D/g, '')
    if (digits.length !== 8) return

    setIsFetchingCep(true)
    setCepMessage(null)
    setIsAddressFromCep(false)

    try {
      const address = await fetchAddressByCep(form.cep)

      if (!address) {
        setCepMessage('CEP não encontrado.')
        return
      }

      setIsAddressFromCep(true)
      setForm((prev) => ({
        ...prev,
        cep: address.cep ?? prev.cep,
        logradouro: address.logradouro ?? prev.logradouro,
        complemento: address.complemento ?? prev.complemento,
        bairro: address.bairro ?? prev.bairro,
        cidade: address.cidade ?? prev.cidade,
        uf: address.uf ?? prev.uf,
        estado: address.estado ?? getStateName(address.uf) ?? prev.estado,
        ibge: address.ibge ?? prev.ibge,
      }))
    } catch {
      setCepMessage('Não foi possível buscar o CEP. Tente novamente.')
    } finally {
      setIsFetchingCep(false)
    }
  }

  const updateVehicleField = <K extends keyof VehicleFormData>(
    field: K,
    value: VehicleFormData[K],
  ) => {
    setVehicleForm((prev) => ({ ...prev, [field]: value }))
    setVehicleErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const result = customerSchema.safeParse(form)

    if (!result.success) {
      setErrors(mapZodErrors(result.error))
      return
    }

    let vehicleData: VehicleFormData | undefined

    if (!isEditing && includeVehicle) {
      const vehicleResult = vehicleFormInputSchema.safeParse(vehicleForm)
      if (!vehicleResult.success) {
        const nextVehicleErrors: VehicleErrors = {}
        for (const issue of vehicleResult.error.issues) {
          const path = issue.path[0] as keyof VehicleFormData
          if (!nextVehicleErrors[path]) {
            nextVehicleErrors[path] = issue.message
          }
        }
        setVehicleErrors(nextVehicleErrors)
        return
      }
      vehicleData = vehicleResult.data
    }

    await onSubmit(result.data, vehicleData)
    setForm(emptyForm)
    setIncludeVehicle(false)
    setVehicleForm(emptyVehicleForm)
    setErrors({})
    setVehicleErrors({})
    setCepMessage(null)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Cliente' : 'Cadastrar Cliente'}
      description={
        isEditing
          ? 'Atualize os dados do proprietário e endereço.'
          : 'Preencha os dados do proprietário. Opcionalmente, cadastre um veículo junto.'
      }
      size="lg"
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
            form="customer-form"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Salvando...'
              : isEditing
                ? 'Salvar Alterações'
                : includeVehicle
                  ? 'Salvar Cliente e Veículo'
                  : 'Salvar Cliente'}
          </button>
        </>
      }
    >
      <form
        id="customer-form"
        className="modal-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <fieldset className="form-section">
          <legend>Proprietário</legend>
          <FormField
            label="Nome"
            name="nome"
            value={form.nome}
            onChange={(e) => updateField('nome', e.target.value)}
            error={errors.nome}
            placeholder="Nome completo do proprietário"
          />
          <FormField
            label="E-mail"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            error={errors.email}
            placeholder="cliente@email.com"
            autoComplete="email"
          />
          <div className="form-row">
            <FormField
              label="CPF/CNPJ"
              name="cpf"
              value={form.cpf ?? ''}
              onChange={(e) => updateField('cpf', formatCpfCnpj(e.target.value))}
              error={errors.cpf}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              maxLength={18}
            />
            <FormField
              label="Telefone"
              name="telefone"
              value={form.telefone}
              onChange={(e) => updateField('telefone', formatPhone(e.target.value))}
              error={errors.telefone}
              placeholder="(11) 99999-9999"
              maxLength={15}
            />
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Endereço</legend>
          <div className="form-row form-row--cep">
            <FormField
              label="CEP"
              name="cep"
              value={form.cep}
              onChange={(e) => {
                updateField('cep', formatCep(e.target.value))
                setIsAddressFromCep(false)
                setCepMessage(null)
              }}
              onBlur={handleCepBlur}
              error={errors.cep}
              placeholder="01310-100"
              maxLength={9}
            />
            {isFetchingCep && (
              <span className="cep-hint">Buscando endereço...</span>
            )}
            {cepMessage && !isFetchingCep && (
              <span className="field-error cep-hint">{cepMessage}</span>
            )}
          </div>

          <FormField
            label="Logradouro"
            name="logradouro"
            value={form.logradouro ?? ''}
            onChange={(e) => updateField('logradouro', e.target.value)}
            error={errors.logradouro}
            placeholder="Rua, avenida..."
            disabled={isAddressFromCep}
          />

          <div className="form-row">
            <FormField
              label="Número"
              name="numero"
              value={form.numero ?? ''}
              onChange={(e) => updateField('numero', e.target.value)}
              error={errors.numero}
              placeholder="123"
            />
            <FormField
              label="Complemento"
              name="complemento"
              value={form.complemento ?? ''}
              onChange={(e) => updateField('complemento', e.target.value)}
              error={errors.complemento}
              placeholder="Apto, bloco..."
            />
          </div>

          <FormField
            label="Bairro"
            name="bairro"
            value={form.bairro ?? ''}
            onChange={(e) => updateField('bairro', e.target.value)}
            error={errors.bairro}
            placeholder="Bairro"
            disabled={isAddressFromCep}
          />

          <div className="form-row form-row--city">
            <div className="form-field">
              <label htmlFor="uf">UF</label>
              <select
                id="uf"
                name="uf"
                value={form.uf ?? ''}
                disabled={isAddressFromCep}
                onChange={(e) => {
                  const uf = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    uf,
                    cidade: '',
                    ibge: '',
                    estado: getStateName(uf) ?? '',
                  }))
                  setErrors((prev) => ({
                    ...prev,
                    uf: undefined,
                    cidade: undefined,
                  }))
                  setMunicipioMessage(null)
                }}
                className={errors.uf ? 'input-error' : undefined}
              >
                <option value="">Selecione a UF</option>
                {BRAZILIAN_STATES.map((state) => (
                  <option key={state.uf} value={state.uf}>
                    {state.uf} — {state.nome}
                  </option>
                ))}
              </select>
              {errors.uf && <span className="field-error">{errors.uf}</span>}
            </div>
            <div className="form-field">
              <label htmlFor="cidade">Cidade</label>
              <select
                id="cidade"
                name="cidade"
                value={form.ibge ?? ''}
                disabled={isAddressFromCep || !form.uf || isLoadingMunicipios}
                onChange={(e) => {
                  const selected = municipios.find(
                    (municipio) => String(municipio.id) === e.target.value,
                  )
                  if (selected) {
                    updateField('ibge', String(selected.id))
                    updateField('cidade', selected.nome)
                    updateField('estado', getStateName(selected.uf) ?? '')
                  } else {
                    updateField('ibge', '')
                    updateField('cidade', '')
                  }
                }}
                className={errors.cidade ? 'input-error' : undefined}
              >
                <option value="">
                  {!form.uf
                    ? 'Selecione a UF primeiro'
                    : isLoadingMunicipios
                      ? 'Carregando municípios...'
                      : municipios.length === 0
                        ? 'Nenhum município encontrado'
                        : 'Selecione a cidade'}
                </option>
                {municipios.map((municipio) => (
                  <option key={municipio.id} value={municipio.id}>
                    {municipio.nome}
                  </option>
                ))}
              </select>
              {errors.cidade && <span className="field-error">{errors.cidade}</span>}
              {municipioMessage && !isLoadingMunicipios && (
                <span className="field-error">{municipioMessage}</span>
              )}
              {!form.uf && (
                <span className="field-hint">Informe a UF para habilitar a cidade.</span>
              )}
            </div>
          </div>
        </fieldset>

        {!isEditing && (
          <fieldset className="form-section">
            <legend>Veículo</legend>
            <label className="vehicle-toggle">
              <input
                type="checkbox"
                checked={includeVehicle}
                onChange={(e) => {
                  setIncludeVehicle(e.target.checked)
                  if (!e.target.checked) {
                    setVehicleForm(emptyVehicleForm)
                    setVehicleErrors({})
                  }
                }}
              />
              Cadastrar veículo junto com o proprietário
            </label>

            {includeVehicle && (
              <VehicleFormFields
                form={vehicleForm}
                errors={vehicleErrors}
                onChange={updateVehicleField}
              />
            )}
          </fieldset>
        )}

      </form>
    </Modal>
  )
}
