import type { CustomerRequest } from '../api/types'
import type { CustomerFormData } from '../schemas/customer.schema'
import { emptyToUndefined } from './address'

function getDocumentDigits(document?: string) {
  return document?.replace(/\D/g, '') ?? ''
}

export function toCustomerRequest(data: CustomerFormData): CustomerRequest {
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
      tipoPessoa: 'PESSOA_JURIDICA',
      email: data.email.trim().toLowerCase(),
      razaoSocial: data.nome,
      nome: data.nome,
      cnpj: data.cpf,
      telefone: data.telefone,
      endereco,
    }
  }

  return {
    tipoPessoa: 'PESSOA_FISICA',
    email: data.email.trim().toLowerCase(),
    nome: data.nome,
    cpf: data.cpf,
    telefone: data.telefone,
    endereco,
  }
}
