export type UserProfile = 'ADMIN' | 'TECNICO' | 'CLIENTE'

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type TipoPessoa = 'PESSOA_FISICA' | 'PESSOA_JURIDICA'

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tipo: string
  accessTokenExpiraEmSegundos: number
  refreshTokenExpiraEmSegundos: number
}

export interface UserResponse {
  id: number
  email: string
  nome: string
  perfil: UserProfile
  clienteId: number | null
  ativo?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface UpdateProfileRequest {
  nome: string
  email: string
}

export interface ChangePasswordRequest {
  senhaAtual: string
  novaSenha: string
  confirmarSenha: string
}

export interface UserRequest {
  email: string
  senha?: string
  nome: string
  perfil: UserProfile
  clienteId?: number | null
  ativo?: boolean
}

export interface EnderecoResponse {
  id?: number
  cep: string | null
  logradouro: string | null
  complemento: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  estado: string | null
  ibge: string | null
}

export interface EnderecoRequest {
  cep: string
  logradouro?: string
  complemento?: string
  numero?: string
  bairro?: string
  cidade?: string
  uf?: string
  estado?: string
  ibge?: string
}

export interface CustomerResponse {
  id: number
  tipoPessoa: TipoPessoa
  email: string | null
  nome: string | null
  razaoSocial: string | null
  nomeFantasia: string | null
  endereco: EnderecoResponse | null
  cpf: string | null
  cnpj: string | null
  telefone: string | null
  usuarioId: number | null
  deveDefinirSenha?: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomerRequest {
  tipoPessoa: TipoPessoa
  email: string
  nome?: string
  razaoSocial?: string
  nomeFantasia?: string
  endereco: EnderecoRequest
  cpf?: string
  cnpj?: string
  telefone?: string
}

export interface ApiErrorBody {
  success?: boolean
  status: number
  message: string
  errors?: string[]
  timestamp?: string
}

export interface ApiEnvelope<T> {
  success: boolean
  status: number
  message: string
  data: T
  timestamp?: string
}

export interface CepResponse {
  cep: string
  logradouro: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  estado: string | null
  ibge: string | null
}

export interface MunicipioResponse {
  id: number
  nome: string
  uf: string
}

export interface VerificarPrimeiroAcessoResponse {
  email: string
  nome: string
  elegivel: boolean
}

export interface VehicleResponse {
  id: number
  placa: string
  marca: string
  modelo: string
  anoFabricacao: number
  motor: string | null
  combustivel: string | null
  kmAtual: number | null
  clienteId: number
  clienteNome: string
  createdAt: string
  updatedAt: string
}

export interface VehicleRequest {
  clienteId: number
  placa: string
  marca: string
  modelo: string
  anoFabricacao: number
  motor?: string
  combustivel?: string
  kmAtual?: number
}

export type ServiceOrderItemType = 'PECA' | 'SERVICO'

export type ServiceOrderStatus =
  | 'ORCAMENTO'
  | 'APROVADO'
  | 'EM_EXECUCAO'
  | 'AGUARDANDO_PECAS'
  | 'CONCLUIDO'
  | 'CANCELADO'

export type ServiceOrderStatusHistoryOrigin = 'CLIENTE' | 'ADMIN' | 'TECNICO' | 'SISTEMA'

export interface ServiceOrderStatusHistoryResponse {
  id: number
  statusAnterior: ServiceOrderStatus | null
  statusNovo: ServiceOrderStatus
  usuarioId: number | null
  usuarioNome: string | null
  origem: ServiceOrderStatusHistoryOrigin
  observacao: string | null
  criadoEm: string
}

export interface ServiceOrderItemResponse {
  id: number
  descricao: string
  quantidade: number
  valorUnitario: number
  tipo: ServiceOrderItemType
  valorTotal: number
}

export interface ServiceOrderItemRequest {
  descricao: string
  quantidade: number
  valorUnitario: number
  tipo: ServiceOrderItemType
}

export interface ServiceOrderResponse {
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
  kmEntrada: number | null
  kmSaida: number | null
  custoServicosTerceirizados: number
  descricaoServicosTerceirizados?: string | null
  custoPecas: number
  custoMaoDeObra: number
  descricaoMaoDeObra?: string | null
  precoTotal: number
  status: ServiceOrderStatus
  itens: ServiceOrderItemResponse[]
  createdAt: string
  updatedAt: string
}

export interface ServiceOrderRequest {
  clienteId: number
  veiculoId: number
  tecnicoId: number
  data: string
  hora: string
  kmEntrada?: number
  kmSaida?: number
  custoServicosTerceirizados: number
  descricaoServicosTerceirizados?: string | null
  custoMaoDeObra: number
  descricaoMaoDeObra?: string | null
  status: ServiceOrderStatus
  itens: ServiceOrderItemRequest[]
}
