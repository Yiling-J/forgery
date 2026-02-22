export interface ExtractedAsset {
  id: string
  name: string
  description: string
  category: string
  imageUrl: string
}

export interface CandidateAsset {
  name: string
  description: string
  category: string
}

export type ExtractionStatus =
  | 'idle'
  | 'analyzing'
  | 'generating'
  | 'splitting'
  | 'selection'
  | 'refining'
  | 'complete'
  | 'error'
