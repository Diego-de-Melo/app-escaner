export interface Product {
  id: string;
  code: string;
  description: string;
  model: string;
  color: string;
  voltage: string;
  brand?: string;
  sku?: string;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedList {
  id: string;
  name: string;
  products: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedLabelData {
  description: string;
  model: string;
  color: string;
  voltage: string;
  brand?: string;
  sku?: string;
  confidence: number;
  rawText: string;
}

export interface ProductFormData {
  description: string;
  model: string;
  color: string;
  voltage: string;
  brand?: string;
  sku?: string;
  quantity: number;
  unit: string;
}
