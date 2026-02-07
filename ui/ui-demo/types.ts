export interface Asset {
  item_name: string;
  background_color: string;
  description: string;
}

export interface AnalysisResponse {
  assets: Asset[];
}

export type ExtractionStatus = 'idle' | 'analyzing' | 'reviewing' | 'generating' | 'sheet_ready' | 'splitting' | 'refining' | 'complete' | 'error' | 'modifying';

export interface ColorMap {
  [key: string]: string;
}

export const HEX_COLORS: ColorMap = {
  Red: '#FF0000',
  Yellow: '#FFFF00',
  Green: '#00FF00',
  White: '#FFFFFF',
  Blue: '#0000FF',
  Black: '#000000',
  Magenta: '#FF00FF',
  Cyan: '#00FFFF',
  Orange: '#FFA500',
  Gray: '#808080',
};

export interface DetectedAssetBox {
  item_name: string;
  coordinates: [number, number, number, number]; // ymin, xmin, ymax, xmax
  bg_color_detected: string;
}

export interface BoundingBoxResponse {
  grid_dimensions: { rows: number; cols: number };
  assets: DetectedAssetBox[];
}

export interface CroppedAsset {
  item_name: string;
  imageUrl: string;
  refinedImageUrl?: string;
  sourceIndex: number;
}

export interface StashItem {
  id: string;
  item_name: string;
  imageUrl: string;
  createdAt: number;
}