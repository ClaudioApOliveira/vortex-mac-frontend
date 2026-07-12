import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createUser, deleteUser, fetchUsers, updateUser } from '../api/users'
import type { UserRequest } from '../api/types'
import { useAuth } from '../contexts/AuthContext'
import { queryKeys } from '../lib/queryKeys'
import type { UserFormData } from '../schemas/user.schema'
import { mapSystemUser } from '../types'
import type { SystemUser } from '../types'
import { getSafeApiErrorMessage } from '../utils/apiMessages'
import { canManageUsers } from '../utils/permissions'

function toUserRequest(data: UserFormData, isEditing: boolean): UserRequest {
  const request: UserRequest = {
    email: data.email,
    nome: data.nome,
    perfil: data.perfil,
    ativo: data.ativo,
    clienteId:
      data.perfil === 'CLIENTE' && data.clienteId ? Number(data.clienteId) : null,
  }

  if (data.senha?.trim()) {
    request.senha = data.senha
  } else if (!isEditing) {
    request.senha = data.senha
  }

  return request
}

function toUserList(data: Awaited<ReturnType<typeof fetchUsers>>) {
  return data.map(mapSystemUser)
}

export function useUsers() {
  const { user, isAuthenticated, syncUser } = useAuth()
  const enabled = isAuthenticated && canManageUsers(user)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: fetchUsers,
    enabled,
    select: toUserList,
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
  }

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const created = await createUser(toUserRequest(data, false))
      return mapSystemUser(created)
    },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UserFormData }) => {
      const updated = await updateUser(id, toUserRequest(data, true))
      return { mapped: mapSystemUser(updated), response: updated }
    },
    onSuccess: ({ mapped, response }) => {
      if (user?.id === mapped.id) {
        syncUser(response)
      }
      void invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: invalidate,
  })

  const error = query.error
    ? getSafeApiErrorMessage(query.error, 'Não foi possível carregar os usuários.')
    : null

  return {
    users: query.data ?? ([] as SystemUser[]),
    isLoading: query.isLoading,
    error,
    addUser: (data: UserFormData) => createMutation.mutateAsync(data),
    editUser: (id: number, data: UserFormData) =>
      updateMutation.mutateAsync({ id, data }).then((result) => result.mapped),
    removeUser: (id: number) => deleteMutation.mutateAsync(id),
    refreshUsers: invalidate,
    isMutating:
      createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  }
}
