import { InferResponseType } from 'hono/client'
import { useCallback, useEffect, useState } from 'react'
import { client } from '../client'
import { useInfiniteScroll } from './use-infinite-scroll'

// Types
type CategoryResponse = InferResponseType<typeof client.categories.$get>
export type Category = CategoryResponse[number]

// Data Item Type
type DataListResponse = InferResponseType<typeof client.categories[':id']['data']['$get']>
export type DataItem = DataListResponse['items'][number]

type CollectionListResponse = InferResponseType<typeof client.categories[':id']['collections']['$get']>
export type CollectionItem = CollectionListResponse[number]

export function useCategory(categoryName: string) {
  const [category, setCategory] = useState<Category | null>(null)
  const [loadingCategory, setLoadingCategory] = useState(true)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'items' | 'collections'>('items')

  // Fetch Category
  const fetchCategory = useCallback(async () => {
    setLoadingCategory(true)
    try {
      const res = await client.categories.$get()
      if (res.ok) {
        const categories = await res.json()
        const cat = categories.find((c) => c.name === categoryName)
        if (cat) {
            setCategory(cat)
        } else {
            console.warn(`Category ${categoryName} not found in`, categories)
        }
      }
    } catch (e) {
      console.error('Failed to fetch categories', e)
    } finally {
      setLoadingCategory(false)
    }
  }, [categoryName])

  useEffect(() => {
    fetchCategory()
  }, [fetchCategory])

  // Data Items
  const {
    items: dataItems,
    loading: loadingData,
    ref: dataRef,
    reset: resetData,
    setItems: setDataItems,
  } = useInfiniteScroll<DataItem>({
    fetchData: async (page, limit) => {
      if (!category) return []

      const query: { page: string; limit: string; option?: string } = {
        page: page.toString(),
        limit: limit.toString(),
      }
      if (selectedOption) {
        query.option = selectedOption
      }

      try {
        const res = await client.categories[':id'].data.$get({
            param: { id: category.id },
            query,
        })
        if (res.ok) {
            const data = await res.json()
            return data.items
        }
      } catch(e) {
          console.error('Failed to fetch data items', e)
      }
      return []
    },
    limit: 20,
  })

  // Collections
  const {
    items: collectionItems,
    loading: loadingCollections,
    ref: collectionRef,
    reset: resetCollections,
    setItems: setCollectionItems,
  } = useInfiniteScroll<CollectionItem>({
    fetchData: async (page, limit) => {
      if (!category) return []

      try {
        const res = await client.categories[':id'].collections.$get({
            param: { id: category.id },
            query: {
            page: page.toString(),
            limit: limit.toString(),
        },
        })
        if (res.ok) {
            return await res.json()
        }
      } catch(e) {
          console.error('Failed to fetch collections', e)
      }
      return []
    },
    limit: 20,
  })

  // Reset when filter changes
  useEffect(() => {
    if (category) {
      if (viewMode === 'items') {
        resetData()
      } else {
        resetCollections()
      }
    }
  }, [category, selectedOption, viewMode, resetData, resetCollections])

  return {
    category,
    loadingCategory,
    selectedOption,
    setSelectedOption,
    viewMode,
    setViewMode,
    dataItems,
    loadingData,
    dataRef,
    resetData,
    setDataItems,
    collectionItems,
    loadingCollections,
    collectionRef,
    resetCollections,
    setCollectionItems,
  }
}
