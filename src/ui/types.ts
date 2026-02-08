export interface ExtractedAsset {
  id: string
  name: string
  description: string
  category: string
  subCategory?: string
  imageUrl: string
}

export type ExtractionStatus =
  | 'idle'
  | 'analyzing'
  | 'generating'
  | 'splitting'
  | 'refining'
  | 'complete'
  | 'error'
