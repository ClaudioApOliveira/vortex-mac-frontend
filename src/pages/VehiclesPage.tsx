import { useState } from 'react'
import { Car } from 'lucide-react'
import { ApiError } from '../api/errors'
import { VehicleFormModal } from '../components/vehicles/VehicleFormModal'
import { useVehicles } from '../contexts/VehicleContext'
import type { VehicleFormData } from '../schemas/vehicle.schema'
import type { Vehicle } from '../types'
import { displayPlaca } from '../utils/masks'
import './CustomersPage.css'

export function VehiclesPage() {
  const { vehicles, isLoading, error, addVehicle, editVehicle, removeVehicle } = useVehicles()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openCreateModal = () => {
    setSelectedVehicle(null)
    setSubmitError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setSubmitError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (clienteId: number, data: VehicleFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      if (selectedVehicle) {
        await editVehicle(selectedVehicle.id, clienteId, data)
      } else {
        await addVehicle(clienteId, data)
      }
      setIsModalOpen(false)
      setSelectedVehicle(null)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : selectedVehicle
            ? 'Não foi possível atualizar o veículo.'
            : 'Não foi possível cadastrar o veículo.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (vehicle: Vehicle) => {
    const confirmed = window.confirm(
      `Excluir o veículo ${displayPlaca(vehicle.placa)} (${vehicle.marca} ${vehicle.modelo})?`,
    )
    if (!confirmed) return

    setSubmitError(null)
    try {
      await removeVehicle(vehicle.id)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Não foi possível excluir o veículo.'
      setSubmitError(message)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Veículos</h1>
          <p className="page-subtitle">
            Gerencie os veículos cadastrados na oficina
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          + Novo Veículo
        </button>
      </header>

      {error && <p className="page-error-banner">{error}</p>}
      {submitError && <p className="page-error-banner">{submitError}</p>}

      {isLoading ? (
        <div className="empty-state">
          <p>Carregando veículos...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <Car className="empty-icon" aria-hidden="true" />
          <h2>Nenhum veículo cadastrado</h2>
          <p>Cadastre o primeiro veículo vinculado a um proprietário.</p>
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            Cadastrar Veículo
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Marca / Modelo</th>
                <th>Ano</th>
                <th>Proprietário</th>
                <th>Motor</th>
                <th>Combustível</th>
                <th>KM atual</th>
                <th>Cadastrado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>
                    <span className="plate-badge">{displayPlaca(vehicle.placa)}</span>
                  </td>
                  <td>
                    <strong>
                      {vehicle.marca} {vehicle.modelo}
                    </strong>
                  </td>
                  <td>{vehicle.anoFabricacao}</td>
                  <td>{vehicle.clienteNome}</td>
                  <td>{vehicle.motor ?? '—'}</td>
                  <td>{vehicle.combustivel ?? '—'}</td>
                  <td>
                    {vehicle.kmAtual !== undefined
                      ? vehicle.kmAtual.toLocaleString('pt-BR')
                      : '—'}
                  </td>
                  <td>{new Date(vehicle.criadoEm).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(vehicle)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(vehicle)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <VehicleFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedVehicle(null)
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        vehicle={selectedVehicle}
      />
    </div>
  )
}
