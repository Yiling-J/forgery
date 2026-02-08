export interface Category {
  id: string;
  name: string;
}

export interface ExtractedAsset {
  id: string;
  name: string;
  description: string;
  category: Category;
  imageUrl: string;
}

export type ExtractionStatus = 'idle' | 'analyzing' | 'generating' | 'splitting' | 'refining' | 'complete' | 'error';
