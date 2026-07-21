// ─── Core Product Interfaces (mirrors Products.Model.js) ─────────────────────

export interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/** Query params for searching & filtering products */
export interface ProductQueryParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}

/** Payload required to create a new product */
export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  images?: string[];
}

/** Payload for updating existing product (all fields optional) */
export type UpdateProductPayload = Partial<CreateProductPayload>;

/** Shape returned by getProducts (paginated response) */
export interface ProductsResponse {
  success: boolean;
  message?: string;
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Shape returned by getProductById / createProduct / updateProduct */
export interface SingleProductResponse {
  success: boolean;
  message?: string;
  data: Product;
}

/** Shape returned by deleteProduct */
export interface DeleteProductResponse {
  success: boolean;
  message: string;
}
