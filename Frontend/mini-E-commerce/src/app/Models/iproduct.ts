// ─── Product model (mirrors Products.Model.js) ───────────────────────────────

export interface Product {
  _id: string;
  createdBy?: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SingleProductResponse {
  success: boolean;
  message?: string;
  data: Product;
}

export interface DeleteProductResponse {
  success: boolean;
  message: string;
}

// ─── Request shapes ───────────────────────────────────────────────────────────

export interface ProductQueryParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;
