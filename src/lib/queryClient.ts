import { QueryClient } from '@tanstack/react-query'
import { QUERY_REFETCH_INTERVAL_MS } from '../constants/pagination'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      refetchInterval: QUERY_REFETCH_INTERVAL_MS,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
})
