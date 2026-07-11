import type {
  CustomerResponse,
  ServiceOrderItemResponse,
  ServiceOrderResponse,
  ServiceOrderStatus,
  UserProfile,
  UserResponse,
  VehicleResponse,
} from '../api/types'

export interface Customer {
  id: number
  nome: string
  email?: string
  cpf?: string
  cnpj?: string
  telefone?: string
  cep?: string
  logradouro?: string
  complemento?: string
  numero?: string
  bairro?: string
  cidade?: string
  uf?: string
  estado?: string
  ibge?: string
  usuarioId?: number | null
  criadoEm: string
  atualizadoEm: string
}

export interface User {
  id: number
  email: string
  nome: string
  perfil: UserProfile
  clienteId: number | null
}

export interface SystemUser {
  id: number
  email: string
  nome: string
  perfil: UserProfile
  clienteId: number | null
  ativo: boolean
  criadoEm?: string
  atualizadoEm?: string
}

export interface Vehicle {
  id: number
  placa: string
  marca: string
  modelo: string
  anoFabricacao: number
  motor?: string
  combustivel?: string
  kmAtual?: number
  clienteId: number
  clienteNome: string
  criadoEm: string
  atualizadoEm: string
}

export interface ServiceOrderItem {
  id?: number
  descricao: string
  quantidade: number
  valorUnitario: number
  tipo: 'PECA' | 'SERVICO'
  valorTotal: number
}

export type { ServiceOrderStatus } from '../api/types'

export interface ServiceOrder {
  id: number
  clienteId: number
  clienteNome: string
  veiculoId: number
  veiculoPlaca: string
  veiculoMarca: string
  veiculoModelo: string
  tecnicoId: number
  tecnicoNome: string
  data: string
  hora: string
  kmEntrada?: number
  kmSaida?: number
  custoServicosTerceirizados: number
  descricaoServicosTerceirizados?: string
  custoPecas: number
  custoMaoDeObra: number
  descricaoMaoDeObra?: string
  precoTotal: number
  status: ServiceOrderStatus
  itens: ServiceOrderItem[]
  criadoEm: string
  atualizadoEm: string
}

export interface Technician {
  id: number
  nome: string
}

export function mapCustomer(response: CustomerResponse): Customer {
  const endereco = response.endereco
  const documento = response.cpf ?? response.cnpj

  return {
    id: response.id,
    nome: response.nome ?? response.razaoSocial ?? '—',
    email: response.email ?? undefined,
    cpf: documento ?? undefined,
    cnpj: response.cnpj ?? undefined,
    telefone: response.telefone ?? undefined,
    cep: endereco?.cep ?? undefined,
    logradouro: endereco?.logradouro ?? undefined,
    complemento: endereco?.complemento ?? undefined,
    numero: endereco?.numero ?? undefined,
    bairro: endereco?.bairro ?? undefined,
    cidade: endereco?.cidade ?? undefined,
    uf: endereco?.uf ?? undefined,
    estado: endereco?.estado ?? undefined,
    ibge: endereco?.ibge ?? undefined,
    usuarioId: response.usuarioId,
    criadoEm: response.createdAt,
    atualizadoEm: response.updatedAt,
  }
}

export function mapUser(response: UserResponse): User {
  return {
    id: response.id,
    email: response.email,
    nome: response.nome,
    perfil: response.perfil,
    clienteId: response.clienteId,
  }
}

export function mapSystemUser(response: UserResponse): SystemUser {
  return {
    id: response.id,
    email: response.email,
    nome: response.nome,
    perfil: response.perfil,
    clienteId: response.clienteId,
    ativo: response.ativo ?? true,
    criadoEm: response.createdAt,
    atualizadoEm: response.updatedAt,
  }
}

export function mapVehicle(response: VehicleResponse): Vehicle {
  return {
    id: response.id,
    placa: response.placa,
    marca: response.marca,
    modelo: response.modelo,
    anoFabricacao: response.anoFabricacao,
    motor: response.motor ?? undefined,
    combustivel: response.combustivel ?? undefined,
    kmAtual: response.kmAtual ?? undefined,
    clienteId: response.clienteId,
    clienteNome: response.clienteNome,
    criadoEm: response.createdAt,
    atualizadoEm: response.updatedAt,
  }
}

function mapServiceOrderItem(response: ServiceOrderItemResponse): ServiceOrderItem {
  return {
    id: response.id,
    descricao: response.descricao,
    quantidade: response.quantidade,
    valorUnitario: response.valorUnitario,
    tipo: response.tipo,
    valorTotal: response.valorTotal,
  }
}

export function mapServiceOrder(response: ServiceOrderResponse): ServiceOrder {
  return {
    id: response.id,
    clienteId: response.clienteId,
    clienteNome: response.clienteNome,
    veiculoId: response.veiculoId,
    veiculoPlaca: response.veiculoPlaca,
    veiculoMarca: response.veiculoMarca,
    veiculoModelo: response.veiculoModelo,
    tecnicoId: response.tecnicoId,
    tecnicoNome: response.tecnicoNome,
    data: response.data,
    hora: response.hora,
    kmEntrada: response.kmEntrada ?? undefined,
    kmSaida: response.kmSaida ?? undefined,
    custoServicosTerceirizados: response.custoServicosTerceirizados,
    descricaoServicosTerceirizados: response.descricaoServicosTerceirizados ?? undefined,
    custoPecas: response.custoPecas,
    custoMaoDeObra: response.custoMaoDeObra,
    descricaoMaoDeObra: response.descricaoMaoDeObra ?? undefined,
    precoTotal: response.precoTotal,
    status: response.status,
    itens: response.itens.map(mapServiceOrderItem),
    criadoEm: response.createdAt,
    atualizadoEm: response.updatedAt,
  }
}

export function mapTechnician(response: UserResponse): Technician {
  return {
    id: response.id,
    nome: response.nome,
  }
}
