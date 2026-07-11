import { useEffect, useState, type FormEvent } from 'react'
import { useCustomers } from '../../contexts/CustomerContext'
import {
  emptyVehicleForm,
  vehicleFormInputSchema,
  type VehicleFormData,
} from '../../schemas/vehicle.schema'
import { displayPlaca } from '../../utils/masks'
import type { Vehicle } from '../../types'
import { Modal } from '../ui/Modal'
import { VehicleFormFields } from './VehicleFormFields'
import '../ui/FormModal.css'
import './VehicleFormFields.css'

interface VehicleFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (clienteId: number, data: VehicleFormData) => Promise<void>
  isSubmitting?: boolean
  vehicle?: Vehicle | null
}

type FormErrors = Partial<Record<keyof VehicleFormData, string>>

function mapZodErrors(
  error: ReturnType<typeof vehicleFormInputSchema.safeParse>['error'],
): FormErrors {
  const errors: FormErrors = {}
  if (!error) return errors

  for (const issue of error.issues) {
    const path = issue.path[0] as keyof VehicleFormData
    if (!errors[path]) {
      errors[path] = issue.message
    }
  }
  return errors
}

function toFormData(vehicle: Vehicle): VehicleFormData {
  return {
    placa: displayPlaca(vehicle.placa),
    marca: vehicle.marca,
    modelo: vehicle.modelo,
    anoFabricacao: String(vehicle.anoFabricacao),
    motor: vehicle.motor ?? '',
    combustivel: vehicle.combustivel ?? '',
    kmAtual: vehicle.kmAtual !== undefined ? String(vehicle.kmAtual) : '',
  }
}

export function VehicleFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  vehicle = null,
}: VehicleFormModalProps) {
  const { customers } = useCustomers()
  const isEditing = vehicle !== null
  const [form, setForm] = useState<VehicleFormData>(emptyVehicleForm)
  const [clienteId, setClienteId] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [clienteError, setClienteError] = useState<string | undefined>()

  useEffect(() => {
    if (!isOpen) return
    setForm(vehicle ? toFormData(vehicle) : emptyVehicleForm)
    setClienteId(vehicle ? String(vehicle.clienteId) : '')
    setErrors({})
    setClienteError(undefined)
  }, [isOpen, vehicle])

  const handleClose = () => {
    if (isSubmitting) return
    setForm(emptyVehicleForm)
    setClienteId('')
    setErrors({})
    setClienteError(undefined)
    onClose()
  }

  const updateField = <K extends keyof VehicleFormData>(
    field: K,
    value: VehicleFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const parsedClienteId = Number(clienteId)
    if (!clienteId || Number.isNaN(parsedClienteId)) {
      setClienteError('Selecione o proprietário')
      return
    }

    const result = vehicleFormInputSchema.safeParse(form)
    if (!result.success) {
      setErrors(mapZodErrors(result.error))
      return
    }

    await onSubmit(parsedClienteId, result.data)
    setForm(emptyVehicleForm)
    setClienteId('')
    setErrors({})
    setClienteError(undefined)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Veículo' : 'Cadastrar Veículo'}
      description="Vincule o veículo ao proprietário e informe os dados do automóvel."
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
            form="vehicle-form"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Veículo'}
          </button>
        </>
      }
    >
      <form id="vehicle-form" className="modal-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="form-section">
          <legend>Veículo</legend>
          <VehicleFormFields
            form={form}
            errors={errors}
            onChange={updateField}
            showClienteSelect
            clienteId={clienteId}
            customers={customers}
            onClienteChange={(value) => {
              setClienteId(value)
              setClienteError(undefined)
            }}
            clienteError={clienteError}
          />
        </fieldset>
      </form>
    </Modal>
  )
}
