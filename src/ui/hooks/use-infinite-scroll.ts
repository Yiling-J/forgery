import { useCallback, useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'

interface UseInfiniteScrollOptions<T> {
  fetchData: (page: number, limit: number) => Promise<T[]>
  initialPage?: number
  limit?: number
}

export function useInfiniteScroll<T>({
  fetchData,
  initialPage = 1,
  limit = 20,
}: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(initialPage)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const { ref, inView } = useInView()

  // Use a ref for fetchData to avoid re-creating loadMore when fetchData changes reference
  // (unless the caller memoizes it, which they might forget)
  const fetchDataRef = useRef(fetchData)
  useEffect(() => {
    fetchDataRef.current = fetchData
  }, [fetchData])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const newItems = await fetchDataRef.current(page, limit)

      // If we got fewer items than limit, we've reached the end
      if (newItems.length < limit) {
        setHasMore(false)
      }

      setItems((prev) => {
        // Optional: deduplicate based on ID if T has an id property?
        // For now, simple append is safer and faster.
        return [...prev, ...newItems]
      })

      if (newItems.length > 0) {
        setPage((prev) => prev + 1)
      } else {
        setHasMore(false)
      }
    } catch (e) {
      console.error('Failed to load more items', e)
    } finally {
      setLoading(false)
    }
  }, [page, limit, loading, hasMore])

  // Trigger load when in view
  useEffect(() => {
    if (inView && !loading && hasMore) {
      loadMore()
    }
  }, [inView, loading, hasMore, loadMore])

  const reset = useCallback(() => {
    setItems([])
    setPage(initialPage)
    setHasMore(true)
    // We don't manually call loadMore here.
    // Clearing items should make the observer visible, triggering the effect.
  }, [initialPage])

  return {
    items,
    loading,
    hasMore,
    ref, // Attach this ref to the loading indicator at the bottom of the list
    reset,
    setItems, // Expose for manual updates (e.g. delete item)
  }
}
