import { FormField } from '../ui/FormField'
import { ANO_VEICULO_MAX } from '../../schemas/vehicle.schema'
import { formatAnoFabModelo, formatPlaca } from '../../utils/masks'
import type { VehicleFormData } from '../../schemas/vehicle.schema'
import './VehicleFormFields.css'

const COMBUSTIVEL_OPTIONS = [
  { value: '', label: 'Selecione' },
  { value: 'GAS', label: 'Gasolina (GAS)' },
  { value: 'ETANOL', label: 'Etanol' },
  { value: 'FLEX', label: 'Flex' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'GNV', label: 'GNV' },
  { value: 'ELETRICO', label: 'Elétrico' },
  { value: 'HIBRIDO', label: 'Híbrido' },
]

type VehicleFormErrors = Partial<Record<keyof VehicleFormData, string>>

interface VehicleFormFieldsProps {
  form: VehicleFormData
  errors: VehicleFormErrors
  onChange: <K extends keyof VehicleFormData>(field: K, value: VehicleFormData[K]) => void
  showClienteSelect?: boolean
  clienteId?: string
  customers?: Array<{ id: number; nome: string }>
  onClienteChange?: (clienteId: string) => void
  clienteError?: string
}

export function VehicleFormFields({
  form,
  errors,
  onChange,
  showClienteSelect = false,
  clienteId = '',
  customers = [],
  onClienteChange,
  clienteError,
}: VehicleFormFieldsProps) {
  return (
    <>
      {showClienteSelect && (
        <div className="form-field">
          <label htmlFor="clienteId">Proprietário</label>
          <select
            id="clienteId"
            name="clienteId"
            value={clienteId}
            onChange={(e) => onClienteChange?.(e.target.value)}
            className={clienteError ? 'input-error' : undefined}
          >
            <option value="">Selecione o proprietário</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.nome}
              </option>
            ))}
          </select>
          {clienteError && <span className="field-error">{clienteError}</span>}
        </div>
      )}

      <div className="form-row">
        <FormField
          label="Placa"
          name="placa"
          value={form.placa}
          onChange={(e) => onChange('placa', formatPlaca(e.target.value))}
          error={errors.placa}
          placeholder="ABC1D23"
          maxLength={8}
        />
        <FormField
          label="Ano fabricação / modelo"
          name="anoFabricacao"
          value={form.anoFabricacao}
          onChange={(e) => onChange('anoFabricacao', formatAnoFabModelo(e.target.value))}
          error={errors.anoFabricacao}
          placeholder={`2025/${ANO_VEICULO_MAX}`}
          title="Primeiro: ano de fabricação. Segundo: ano de modelo."
          inputMode="numeric"
          maxLength={9}
        />
      </div>

      <div className="form-row">
        <FormField
          label="Marca"
          name="marca"
          value={form.marca}
          onChange={(e) => onChange('marca', e.target.value)}
          error={errors.marca}
          placeholder="Fiat"
        />
        <FormField
          label="Modelo"
          name="modelo"
          value={form.modelo}
          onChange={(e) => onChange('modelo', e.target.value)}
          error={errors.modelo}
          placeholder="Doblo"
        />
      </div>

      <div className="form-row">
        <FormField
          label="Motor"
          name="motor"
          value={form.motor ?? ''}
          onChange={(e) => onChange('motor', e.target.value)}
          error={errors.motor}
          placeholder="1.6"
        />
        <div className="form-field">
          <label htmlFor="combustivel">Combustível</label>
          <select
            id="combustivel"
            name="combustivel"
            value={form.combustivel ?? ''}
            onChange={(e) => onChange('combustivel', e.target.value)}
            className={errors.combustivel ? 'input-error' : undefined}
          >
            {COMBUSTIVEL_OPTIONS.map((option) => (
              <option key={option.value || 'empty'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.combustivel && <span className="field-error">{errors.combustivel}</span>}
        </div>
      </div>

      <FormField
        label="KM atual"
        name="kmAtual"
        type="number"
        value={form.kmAtual ?? ''}
        onChange={(e) => onChange('kmAtual', e.target.value)}
        error={errors.kmAtual}
        placeholder="150000"
        min={0}
      />
    </>
  )
}
