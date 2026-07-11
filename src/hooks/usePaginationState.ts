import { useCallback, useState } from 'react'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../constants/pagination'

export function usePaginationState(initialPageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [pageSize, setPageSizeState] = useState(initialPageSize)

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setPage(DEFAULT_PAGE)
  }, [])

  const resetPage = useCallback(() => {
    setPage(DEFAULT_PAGE)
  }, [])

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    resetPage,
  }
}
