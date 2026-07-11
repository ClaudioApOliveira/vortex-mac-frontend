import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createCustomer,
  deleteCustomer,
  fetchCustomers,
  updateCustomer,
} from '../api/customers'
import type { CustomerFormData } from '../schemas/customer.schema'
import { emptyToUndefined } from '../utils/address'
import { mapCustomer } from '../types'
import type { Customer } from '../types'
import { canManageCustomers } from '../utils/permissions'
import { useAuth } from './AuthContext'

interface CustomerContextValue {
  customers: Customer[]
  isLoading: boolean
  error: string | null
  addCustomer: (data: CustomerFormData) => Promise<Customer>
  editCustomer: (id: number, data: CustomerFormData) => Promise<Customer>
  removeCustomer: (id: number) => Promise<void>
  refreshCustomers: () => Promise<void>
}

const CustomerContext = createContext<CustomerContextValue | null>(null)

function getDocumentDigits(document?: string) {
  return document?.replace(/\D/g, '') ?? ''
}

function toCustomerRequest(data: CustomerFormData) {
  const docDigits = getDocumentDigits(data.cpf)
  const isPessoaJuridica = docDigits.length === 14

  const endereco = {
    cep: data.cep,
    logradouro: emptyToUndefined(data.logradouro),
    complemento: emptyToUndefined(data.complemento),
    numero: emptyToUndefined(data.numero),
    bairro: emptyToUndefined(data.bairro),
    cidade: emptyToUndefined(data.cidade),
    uf: emptyToUndefined(data.uf)?.toUpperCase(),
    estado: emptyToUndefined(data.estado),
    ibge: emptyToUndefined(data.ibge),
  }

  if (isPessoaJuridica) {
    return {
      tipoPessoa: 'PESSOA_JURIDICA' as const,
      email: data.email.trim().toLowerCase(),
      razaoSocial: data.nome,
      nome: data.nome,
      cnpj: data.cpf,
      telefone: data.telefone,
      endereco,
    }
  }

  return {
    tipoPessoa: 'PESSOA_FISICA' as const,
    email: data.email.trim().toLowerCase(),
    nome: data.nome,
    cpf: data.cpf,
    telefone: data.telefone,
    endereco,
  }
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshCustomers = useCallback(async () => {
    if (!canManageCustomers(user)) {
      setCustomers([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchCustomers()
      setCustomers(response.map(mapCustomer))
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível carregar os clientes.'
      setError(message)
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isAuthenticated && canManageCustomers(user)) {
      void refreshCustomers()
      return
    }

    setCustomers([])
    setError(null)
  }, [isAuthenticated, user, refreshCustomers])

  const addCustomer = useCallback(async (data: CustomerFormData) => {
    const created = await createCustomer(toCustomerRequest(data))
    const customer = mapCustomer(created)
    setCustomers((prev) => [customer, ...prev])
    return customer
  }, [])

  const editCustomer = useCallback(async (id: number, data: CustomerFormData) => {
    const updated = await updateCustomer(id, toCustomerRequest(data))
    const customer = mapCustomer(updated)
    setCustomers((prev) => prev.map((item) => (item.id === id ? customer : item)))
    return customer
  }, [])

  const removeCustomer = useCallback(async (id: number) => {
    await deleteCustomer(id)
    setCustomers((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      customers,
      isLoading,
      error,
      addCustomer,
      editCustomer,
      removeCustomer,
      refreshCustomers,
    }),
    [
      customers,
      isLoading,
      error,
      addCustomer,
      editCustomer,
      removeCustomer,
      refreshCustomers,
    ],
  )

  return (
    <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>
  )
}

export function useCustomers() {
  const context = useContext(CustomerContext)
  if (!context) {
    throw new Error('useCustomers deve ser usado dentro de CustomerProvider')
  }
  return context
}
