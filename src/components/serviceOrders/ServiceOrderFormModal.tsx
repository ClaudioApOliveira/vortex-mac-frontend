import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { fetchServiceOrderStatusHistory } from '../../api/serviceOrders'
import { ApiError } from '../../api/errors'
import { fetchTechnicians } from '../../api/technicians'
import type { ServiceOrderStatusHistoryResponse } from '../../api/types'
import { useAuth } from '../../contexts/AuthContext'
import { useCustomers } from '../../hooks/useCustomers'
import { useVehicles } from '../../hooks/useVehicles'
import {
  calculateServiceOrderTotals,
  emptyServiceOrderForm,
  emptyServiceOrderItem,
  serviceOrderFormSchema,
  type ServiceOrderFormData,
  type ServiceOrderItemFormData,
} from '../../schemas/serviceOrder.schema'
import type { ServiceOrder } from '../../types'
import type { Technician } from '../../types'
import { mapTechnician } from '../../types'
import { displayPlaca, formatMoneyFromNumber, formatMoneyInput } from '../../utils/masks'
import { getFormStatusOptions } from '../../utils/serviceOrderTransitions'
import { formatCurrency, getServiceOrderStatusLabel } from '../../utils/serviceOrder'
import { FormField, RequiredMark } from '../ui/FormField'
import { SelectField } from '../ui/SelectField'
import { TextAreaField } from '../ui/TextAreaField'
import { Modal } from '../ui/Modal'
import { ServiceOrderItemsEditor } from './ServiceOrderItemsEditor'
import { ServiceOrderStatusBadge } from './ServiceOrderStatusBadge'
import './ServiceOrderStatusBadge.css'
import { ServiceOrderStatusHistory } from './ServiceOrderStatusHistory'
import './ServiceOrderStatusHistory.css'
import '../ui/FormModal.css'
import './ServiceOrderItemsEditor.css'

interface ServiceOrderFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ServiceOrderFormData) => Promise<void>
  isSubmitting?: boolean
  serviceOrder?: ServiceOrder | null
  submitError?: string | null
}

type FormErrors = Partial<Record<keyof ServiceOrderFormData, string>>
type ItemErrors = Partial<Record<keyof ServiceOrderItemFormData, string>>

function mapZodErrors(
  error: ReturnType<typeof serviceOrderFormSchema.safeParse>['error'],
): { formErrors: FormErrors; itemErrors: Record<number, ItemErrors> } {
  const formErrors: FormErrors = {}
  const itemErrors: Record<number, ItemErrors> = {}

  if (!error) return { formErrors, itemErrors }

  for (const issue of error.issues) {
    if (issue.path[0] === 'itens' && typeof issue.path[1] === 'number') {
      const index = issue.path[1]
      const field = issue.path[2] as keyof ServiceOrderItemFormData
      if (!itemErrors[index]) itemErrors[index] = {}
      if (!itemErrors[index][field]) itemErrors[index][field] = issue.message
      continue
    }

    const field = issue.path[0] as keyof ServiceOrderFormData
    if (!formErrors[field]) formErrors[field] = issue.message
  }

  return { formErrors, itemErrors }
}

function toFormData(serviceOrder: ServiceOrder): ServiceOrderFormData {
  return {
    clienteId: String(serviceOrder.clienteId),
    veiculoId: String(serviceOrder.veiculoId),
    tecnicoId: String(serviceOrder.tecnicoId),
    data: serviceOrder.data,
    hora: serviceOrder.hora.slice(0, 5),
    kmEntrada: serviceOrder.kmEntrada !== undefined ? String(serviceOrder.kmEntrada) : '',
    kmSaida: serviceOrder.kmSaida !== undefined ? String(serviceOrder.kmSaida) : '',
    diagnosticoInicial: serviceOrder.diagnosticoInicial ?? '',
    custoServicosTerceirizados: formatMoneyFromNumber(serviceOrder.custoServicosTerceirizados),
    descricaoServicosTerceirizados: serviceOrder.descricaoServicosTerceirizados ?? '',
    custoMaoDeObra: formatMoneyFromNumber(serviceOrder.custoMaoDeObra),
    descricaoMaoDeObra: serviceOrder.descricaoMaoDeObra ?? '',
    status: serviceOrder.status,
    itens: serviceOrder.itens.map((item) => ({
      descricao: item.descricao,
      quantidade: String(item.quantidade).replace('.', ','),
      valorUnitario: formatMoneyFromNumber(item.valorUnitario),
      tipo: 'PECA' as const,
    })),
  }
}

export function ServiceOrderFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  serviceOrder = null,
  submitError = null,
}: ServiceOrderFormModalProps) {
  const isEditing = serviceOrder !== null
  const { user } = useAuth()
  const { customers } = useCustomers()
  const { vehicles } = useVehicles()
  const [form, setForm] = useState<ServiceOrderFormData>(emptyServiceOrderForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [itemErrors, setItemErrors] = useState<Record<number, ItemErrors>>({})
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false)
  const [statusHistory, setStatusHistory] = useState<ServiceOrderStatusHistoryResponse[]>([])
  const [isLoadingStatusHistory, setIsLoadingStatusHistory] = useState(false)
  const [statusHistoryError, setStatusHistoryError] = useState<string | null>(null)

  const statusOptions = useMemo(() => {
    if (!isEditing || !serviceOrder) return []
    return getFormStatusOptions(serviceOrder.status, user)
  }, [isEditing, serviceOrder, user])
  const isTechnicianWithApprovedStatus =
    user?.perfil === 'TECNICO' && serviceOrder?.status === 'APROVADO'
  const canSelectCurrentStatus = statusOptions.includes(form.status)

  const customerVehicles = useMemo(
    () =>
      form.clienteId
        ? vehicles.filter((vehicle) => vehicle.clienteId === Number(form.clienteId))
        : [],
    [form.clienteId, vehicles],
  )

  const totals = useMemo(
    () =>
      calculateServiceOrderTotals(
        form.itens,
        form.custoServicosTerceirizados,
        form.custoMaoDeObra,
      ),
    [form.itens, form.custoServicosTerceirizados, form.custoMaoDeObra],
  )

  useEffect(() => {
    if (!isOpen) return
    setForm(serviceOrder ? toFormData(serviceOrder) : emptyServiceOrderForm)
    setErrors({})
    setItemErrors({})
    setStatusHistory([])
    setStatusHistoryError(null)
  }, [isOpen, serviceOrder])

  useEffect(() => {
    if (!isOpen || !serviceOrder?.id) return

    let cancelled = false
    setIsLoadingStatusHistory(true)
    setStatusHistoryError(null)

    fetchServiceOrderStatusHistory(serviceOrder.id)
      .then((data) => {
        if (!cancelled) setStatusHistory(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setStatusHistory([])
          setStatusHistoryError(
            err instanceof ApiError
              ? err.message
              : 'Não foi possível carregar o histórico de status.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStatusHistory(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, serviceOrder?.id])

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    setIsLoadingTechnicians(true)

    fetchTechnicians()
      .then((data) => {
        if (!cancelled) setTechnicians(data.map(mapTechnician))
      })
      .catch(() => {
        if (!cancelled) setTechnicians([])
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTechnicians(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || isEditing || !user) return
    if (user.perfil !== 'TECNICO' && user.perfil !== 'GERENTE') return
    if (!technicians.some((technician) => technician.id === user.id)) return

    setForm((prev) => {
      if (prev.tecnicoId) return prev
      return { ...prev, tecnicoId: String(user.id) }
    })
  }, [isOpen, isEditing, user, technicians])

  const handleClose = () => {
    if (isSubmitting) return
    setForm(emptyServiceOrderForm)
    setErrors({})
    setItemErrors({})
    onClose()
  }

  const updateField = <K extends keyof ServiceOrderFormData>(
    field: K,
    value: ServiceOrderFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const updateItem = (
    index: number,
    field: keyof ServiceOrderItemFormData,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      itens: prev.itens.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }))
    setItemErrors((prev) => {
      if (!prev[index]) return prev
      const next = { ...prev }
      delete next[index][field]
      return next
    })
  }

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      itens: [...prev.itens, { ...emptyServiceOrderItem }],
    }))
  }

  const removeItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, itemIndex) => itemIndex !== index),
    }))
    setItemErrors((prev) => {
      const next: Record<number, ItemErrors> = {}
      Object.entries(prev).forEach(([key, value]) => {
        const itemIndex = Number(key)
        if (itemIndex < index) next[itemIndex] = value
        if (itemIndex > index) next[itemIndex - 1] = value
      })
      return next
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const result = serviceOrderFormSchema.safeParse(form)

    if (!result.success) {
      const parsed = mapZodErrors(result.error)
      setErrors(parsed.formErrors)
      setItemErrors(parsed.itemErrors)
      return
    }

    try {
      await onSubmit(result.data)
      setForm(emptyServiceOrderForm)
      setErrors({})
      setItemErrors({})
    } catch {
      // submitError é exibido pelo parent dentro do modal
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
      description="Registre o atendimento, peças, serviços e totais conforme a ordem de serviço da oficina."
      size="xl"
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
            form="service-order-form"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar OS'}
          </button>
        </>
      }
    >
      <form
        id="service-order-form"
        className="modal-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <p className="form-required-hint">
          <RequiredMark /> Campos obrigatórios
        </p>
        {submitError && <p className="form-error-banner">{submitError}</p>}
        <fieldset className="form-section">
          <legend>Atendimento</legend>
          <div className="form-field">
            <label htmlFor="status">
              Status
              <RequiredMark />
            </label>
            {!isEditing ? (
              <>
                <div className="service-order-status-readonly">
                  <ServiceOrderStatusBadge status="ORCAMENTO" />
                </div>
                <p className="field-hint">
                  Novas OS começam como orçamento. Avance o status depois, na lista ou no
                  detalhe.
                </p>
                <input type="hidden" name="status" value="ORCAMENTO" />
              </>
            ) : isTechnicianWithApprovedStatus ? (
              <>
                <div className="service-order-status-readonly">
                  <ServiceOrderStatusBadge status={form.status} />
                  <p className="field-hint">
                    A aprovação é feita pelo cliente ou administrador. Selecione abaixo
                    para avançar o atendimento.
                  </p>
                </div>
                <select
                  id="status"
                  name="status"
                  value={canSelectCurrentStatus ? form.status : ''}
                  onChange={(e) => {
                    if (!e.target.value) return
                    updateField('status', e.target.value as ServiceOrderFormData['status'])
                  }}
                  className={errors.status ? 'input-error' : undefined}
                >
                  <option value="">Manter aprovado</option>
                  {statusOptions
                    .filter((status) => status !== 'APROVADO')
                    .map((status) => (
                      <option key={status} value={status}>
                        {getServiceOrderStatusLabel(status)}
                      </option>
                    ))}
                </select>
              </>
            ) : (
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={(e) =>
                  updateField('status', e.target.value as ServiceOrderFormData['status'])
                }
                className={errors.status ? 'input-error' : undefined}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {getServiceOrderStatusLabel(status)}
                  </option>
                ))}
              </select>
            )}
            {user?.perfil === 'TECNICO' && isEditing && !isTechnicianWithApprovedStatus && (
              <p className="field-hint">
                Técnicos não podem aprovar orçamentos. A aprovação é feita pelo cliente,
                gerente ou administrador.
              </p>
            )}
            {errors.status && <span className="field-error">{errors.status}</span>}
          </div>

          <div className="form-row">
            <FormField
              label="Data"
              name="data"
              type="date"
              value={form.data}
              onChange={(e) => updateField('data', e.target.value)}
              error={errors.data}
              required
            />
            <FormField
              label="Hora"
              name="hora"
              type="time"
              value={form.hora}
              onChange={(e) => updateField('hora', e.target.value)}
              error={errors.hora}
              required
            />
          </div>

          <SelectField
            label="Proprietário"
            name="clienteId"
            required
            value={form.clienteId}
            onChange={(e) => {
              const clienteId = e.target.value
              setForm((prev) => ({
                ...prev,
                clienteId,
                veiculoId: '',
              }))
              setErrors((prev) => ({
                ...prev,
                clienteId: undefined,
                veiculoId: undefined,
              }))
            }}
            error={errors.clienteId}
          >
            <option value="">Selecione o proprietário</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.nome}
              </option>
            ))}
          </SelectField>

          <div className="form-row">
            <SelectField
              label="Veículo"
              name="veiculoId"
              required
              value={form.veiculoId}
              disabled={!form.clienteId}
              onChange={(e) => updateField('veiculoId', e.target.value)}
              error={errors.veiculoId}
            >
              <option value="">
                {!form.clienteId ? 'Selecione o proprietário primeiro' : 'Selecione o veículo'}
              </option>
              {customerVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {displayPlaca(vehicle.placa)} — {vehicle.marca} {vehicle.modelo}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Responsável"
              name="tecnicoId"
              required
              value={form.tecnicoId}
              disabled={isLoadingTechnicians}
              onChange={(e) => updateField('tecnicoId', e.target.value)}
              error={errors.tecnicoId}
            >
              <option value="">
                {isLoadingTechnicians
                  ? 'Carregando responsáveis...'
                  : 'Selecione o responsável'}
              </option>
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.nome}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="form-row">
            <FormField
              label="KM entrada"
              name="kmEntrada"
              type="number"
              value={form.kmEntrada ?? ''}
              onChange={(e) => updateField('kmEntrada', e.target.value)}
              error={errors.kmEntrada}
              min={0}
            />
            <FormField
              label="KM saída"
              name="kmSaida"
              type="number"
              value={form.kmSaida ?? ''}
              onChange={(e) => updateField('kmSaida', e.target.value)}
              error={errors.kmSaida}
              min={0}
            />
          </div>

          <TextAreaField
            label="Diagnóstico"
            name="diagnosticoInicial"
            rows={4}
            value={form.diagnosticoInicial ?? ''}
            onChange={(e) => updateField('diagnosticoInicial', e.target.value)}
            placeholder="Ex.: Cliente relata ruído ao frear; verificar pastilhas e discos. Complementar após inspeção..."
            error={errors.diagnosticoInicial}
          />
        </fieldset>

        <fieldset className="form-section">
          <legend>Itens</legend>
          <ServiceOrderItemsEditor
            itens={form.itens}
            errors={itemErrors}
            onChange={updateItem}
            onAdd={addItem}
            onRemove={removeItem}
          />
          {errors.itens && <span className="field-error">{errors.itens}</span>}
        </fieldset>

        <fieldset className="form-section">
          <legend>Totais</legend>
          <div className="form-row">
            <FormField
              label="Serviços terceirizados"
              name="custoServicosTerceirizados"
              type="text"
              inputMode="decimal"
              value={form.custoServicosTerceirizados}
              onChange={(e) =>
                updateField('custoServicosTerceirizados', formatMoneyInput(e.target.value))
              }
              error={errors.custoServicosTerceirizados}
              required
            />
            <FormField
              label="Mão de obra"
              name="custoMaoDeObra"
              type="text"
              inputMode="decimal"
              value={form.custoMaoDeObra}
              onChange={(e) => updateField('custoMaoDeObra', formatMoneyInput(e.target.value))}
              error={errors.custoMaoDeObra}
              placeholder="0,00"
              required
            />
          </div>

          <div className="form-row">
            <TextAreaField
              label="Descrição serviços terceirizados"
              name="descricaoServicosTerceirizados"
              rows={3}
              value={form.descricaoServicosTerceirizados ?? ''}
              onChange={(e) => updateField('descricaoServicosTerceirizados', e.target.value)}
              placeholder="Ex.: Retífica do cabeçote, balanceamento..."
              error={errors.descricaoServicosTerceirizados}
            />
            <TextAreaField
              label="Descrição mão de obra"
              name="descricaoMaoDeObra"
              rows={3}
              value={form.descricaoMaoDeObra ?? ''}
              onChange={(e) => updateField('descricaoMaoDeObra', e.target.value)}
              placeholder="Ex.: Troca de óleo, revisão de freios..."
              error={errors.descricaoMaoDeObra}
            />
          </div>

          <div className="os-totals">
            <div className="os-total-item">
              <span>Serviços terceirizados</span>
              <strong>{formatCurrency(totals.custoServicosTerceirizados)}</strong>
            </div>
            <div className="os-total-item">
              <span>Peças</span>
              <strong>{formatCurrency(totals.custoPecas)}</strong>
            </div>
            <div className="os-total-item">
              <span>Mão de obra</span>
              <strong>{formatCurrency(totals.custoMaoDeObra)}</strong>
            </div>
            <div className="os-total-item os-total-item--highlight">
              <span>Preço total</span>
              <strong>{formatCurrency(totals.precoTotal)}</strong>
            </div>
          </div>
        </fieldset>

        {isEditing && (
          <fieldset className="form-section">
            <ServiceOrderStatusHistory
              entries={statusHistory}
              isLoading={isLoadingStatusHistory}
              error={statusHistoryError}
            />
          </fieldset>
        )}
      </form>
    </Modal>
  )
}
