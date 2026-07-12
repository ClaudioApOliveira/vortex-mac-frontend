import { keepPreviousData, useQuery, type UseQueryOptions } from '@tanstack/react-query'
import type { PageResponse } from '../api/types'
import { QUERY_REFETCH_INTERVAL_MS } from '../constants/pagination'

type PaginatedQueryOptions<T> = Omit<
  UseQueryOptions<PageResponse<T>>,
  'queryKey' | 'queryFn' | 'placeholderData'
>

interface UsePaginatedQueryParams<T> {
  queryKey: readonly unknown[]
  queryFn: (page: number, pageSize: number) => Promise<PageResponse<T>>
  page: number
  pageSize: number
  enabled?: boolean
  /** Atualização periódica em telas que precisam de dados ao vivo */
  live?: boolean
  options?: PaginatedQueryOptions<T>
}

export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  page,
  pageSize,
  enabled = true,
  live = false,
  options,
}: UsePaginatedQueryParams<T>) {
  const query = useQuery({
    queryKey: [...queryKey, page, pageSize],
    queryFn: () => queryFn(page, pageSize),
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: live ? QUERY_REFETCH_INTERVAL_MS : false,
    refetchOnWindowFocus: live,
    ...options,
  })

  return {
    ...query,
    items: query.data?.content ?? [],
    totalElements: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    currentPage: query.data?.page ?? page,
    currentPageSize: query.data?.size ?? pageSize,
  }
}
