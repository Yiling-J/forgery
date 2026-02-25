import { Edit, Plus, ScanLine, Trash2, Upload } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { client } from '../client'
import { CollectionDialog } from '../components/CollectionDialog'
import { ExtractorDialog } from '../components/ExtractorDialog'
import { ItemDetailsDialog } from '../components/ItemDetailsDialog'
import { PageHeader } from '../components/PageHeader'
import { UploadItemDialog } from '../components/UploadItemDialog'
import { VibeCard } from '../components/VibeCard'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area'
import { CollectionItem, DataItem, useCategory } from '../hooks/use-category'
import { cn } from '../lib/utils'

interface CategoryPageProps {
  categoryName: string
}

const getEquipmentColor = (name: string) => {
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7']
  const charCode = name.charCodeAt(0) || 0
  return colors[charCode % colors.length]
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ categoryName }) => {
  const {
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
    collectionItems,
    loadingCollections,
    collectionRef,
    resetCollections,
    setCollectionItems, // Important to remove deleted items
  } = useCategory(categoryName)

  const [extractorOpen, setExtractorOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [collectionOpen, setCollectionOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DataItem | null>(null)
  const [itemDetailsOpen, setItemDetailsOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<CollectionItem | null>(null)

  // Derived states
  const categoryOptions = category ? category.options : []

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await client.data[':id'].$delete({ param: { id } })
      toast.success('Item deleted')
      resetData()
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete item')
    }
  }

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return
    try {
      await client.collections[':id'].$delete({ param: { id } })
      toast.success('Collection deleted')
      setCollectionItems((prev) => prev.filter((c) => c.id !== id))
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete collection')
    }
  }

  if (loadingCategory) {
    return <div className="p-8 text-center text-slate-400">Loading category...</div>
  }

  if (!category) {
    return <div className="p-8 text-center text-red-400">Category not found</div>
  }

  const showCollections = category.maxCount > 1

  return (
    <div className="w-full h-full px-4 flex flex-col font-sans text-slate-900 relative">
      <PageHeader
        title={viewMode === 'items' ? `${category.name}s` : `${category.name} Collections`}
        subtitle={
          <>
            System //{' '}
            <span
              className={cn(
                'cursor-pointer hover:text-cyan-500 transition-colors',
                viewMode === 'items' ? '' : 'text-muted-foreground/80',
              )}
              onClick={() => setViewMode('items')}
            >
              {category.name}_List
            </span>
            {showCollections && (
              <>
                {' '}
                <span>|</span>{' '}
                <span
                  className={cn(
                    'cursor-pointer hover:text-cyan-500 transition-colors',
                    viewMode === 'collections' ? '' : 'text-muted-foreground/80',
                  )}
                  onClick={() => setViewMode('collections')}
                >
                  Collection_List
                </span>
              </>
            )}
          </>
        }
        actions={
          viewMode === 'items' ? (
            <div className="flex gap-2">
              <Button onClick={() => setUploadOpen(true)} variant="secondary" className="border">
                <Upload className="mr-2 h-4 w-4" /> Upload
              </Button>
              <Button onClick={() => setExtractorOpen(true)}>
                <ScanLine className="mr-2 h-4 w-4" /> Extractor
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => {
                setSelectedCollection(null)
                setCollectionOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Create Collection
            </Button>
          )
        }
        className="mb-8"
      >
        {/* Options Filter */}
        {viewMode === 'items' && categoryOptions.length > 0 && (
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-2 p-1">
              {categoryOptions.map((opt) => {
                const isSelected = selectedOption === opt
                return (
                  <Badge
                    key={opt}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105 active:scale-95 select-none rounded-none clip-path-slant',
                      isSelected
                        ? 'bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300',
                    )}
                    onClick={() => setSelectedOption(isSelected ? null : opt)}
                  >
                    {opt}
                  </Badge>
                )
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </PageHeader>

      {/* Items Grid */}
      {viewMode === 'items' ? (
        <>
          {dataItems.length === 0 && !loadingData ? (
            <div className="text-center p-12 bg-white clip-path-slant border border-slate-200">
              <p className="text-slate-500 font-mono">No items found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 max-w-[1920px] mx-auto w-full pb-10">
              {dataItems.map((item, index) => (
                <VibeCard
                  key={item.id}
                  index={index}
                  name={item.name}
                  subtitle={item.option || category.name}
                  image={item.image?.path ? `/files/${item.image.path}` : ''}
                  color={getEquipmentColor(item.name)}
                  onClick={() => {
                    setSelectedItem(item)
                    setItemDetailsOpen(true)
                  }}
                  actions={[
                    {
                      name: 'Delete',
                      onClick: () => handleDeleteItem(item.id),
                      variant: 'destructive',
                      icon: <Trash2 className="w-4 h-4" />,
                    },
                  ]}
                />
              ))}
            </div>
          )}
          <div ref={dataRef} className="h-10 w-full flex items-center justify-center p-4">
            {loadingData && (
              <div className="text-slate-400 font-mono tracking-widest animate-pulse">
                LOADING...
              </div>
            )}
          </div>
        </>
      ) : (
        // Collections Grid
        <>
          {collectionItems.length === 0 && !loadingCollections ? (
            <div className="text-center p-12 bg-white clip-path-slant border border-slate-200">
              <p className="text-slate-500 font-mono">No collections found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 max-w-[1920px] mx-auto w-full pb-10">
              {collectionItems.map((col, index) => (
                <VibeCard
                  key={col.id}
                  index={index}
                  name={col.name}
                  subtitle={`${col.items.length} items`}
                  color={getEquipmentColor(col.name)}
                  onClick={() => {
                    setSelectedCollection(col)
                    setCollectionOpen(true)
                  }}
                  actions={[
                    {
                      name: 'Edit',
                      onClick: () => {
                        setSelectedCollection(col)
                        setCollectionOpen(true)
                      },
                      icon: <Edit className="w-4 h-4" />,
                    },
                    {
                      name: 'Delete',
                      onClick: () => handleDeleteCollection(col.id),
                      variant: 'destructive',
                      icon: <Trash2 className="w-4 h-4" />,
                    },
                  ]}
                >
                  {/* Preview Grid for Collection */}
                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <div className="w-full h-[80%] grid grid-cols-3 grid-rows-3">
                      {Array.from({ length: 9 }).map((_, i) => {
                        const item = col.items[i]
                        const totalCount = col.items.length

                        if (i === 8 && totalCount > 9) {
                          const extraCount = totalCount - 8
                          return (
                            <div
                              key={i}
                              className="relative w-full h-full border-[0.5px] border-slate-200 bg-slate-50 overflow-hidden"
                            >
                              {item && item.image?.path && (
                                <img
                                  src={`/files/${item.image.path}`}
                                  alt="More"
                                  className="w-full h-full object-cover opacity-50 grayscale"
                                />
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-bold text-lg backdrop-blur-[1px]">
                                +{extraCount}
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div
                            key={i}
                            className="relative w-full h-full border-[0.5px] border-slate-200 bg-slate-50 overflow-hidden"
                          >
                            {item && item.image?.path ? (
                              <img
                                src={`/files/${item.image.path}`}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-100/50" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </VibeCard>
              ))}
            </div>
          )}
          <div ref={collectionRef} className="h-10 w-full flex items-center justify-center p-4">
            {loadingCollections && (
              <div className="text-slate-400 font-mono tracking-widest animate-pulse">
                LOADING...
              </div>
            )}
          </div>
        </>
      )}

      {/* Dialogs */}
      <UploadItemDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={resetData}
        category={category}
      />
      <ExtractorDialog
        open={extractorOpen}
        onOpenChange={setExtractorOpen}
        onSuccess={() => {
          resetData()
          setExtractorOpen(false)
        }}
        category={category}
      />
      <CollectionDialog
        open={collectionOpen}
        onOpenChange={(open) => {
          setCollectionOpen(open)
          if (!open) setSelectedCollection(null)
        }}
        onSuccess={() => {
          resetCollections()
        }}
        collection={selectedCollection}
        category={category}
      />
      <ItemDetailsDialog
        open={itemDetailsOpen}
        onOpenChange={setItemDetailsOpen}
        item={selectedItem}
        category={category}
        onUpdate={resetData}
      />
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
