export type AppStage = 'upload' | 'analyze' | 'split' | 'refine' | 'completed'

export interface ImageSegment {
  id: string
  src: string
  selected: boolean
  status: 'pending' | 'processing' | 'completed'
}

export interface ProcessingState {
  isProcessing: boolean
  currentId: string | null
}
