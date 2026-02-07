export interface Asset {
  item_name: string;
  background_color: string;
  description: string;
  category: string;
}

export interface ExtractedAsset extends Asset {
  imageUrl: string;
  id?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface StashItem {
  id: string;
  item_name: string;
  imageUrl: string;
  description: string;
  category?: Category;
  subCategory?: Category;
  createdAt: number;
}

export type ExtractionStatus = 'idle' | 'analyzing' | 'generating' | 'splitting' | 'refining' | 'complete' | 'error';
