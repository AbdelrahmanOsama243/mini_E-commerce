import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './environment';

// ─── Interfaces (mirrors Products.Model.js) ──────────────────────────────────

export interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by getProducts (paginated list from BaseRepo.findAll) */
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

// ─── Query params for getProducts ────────────────────────────────────────────

export interface ProductQueryParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

// ─── Payload for createProduct ───────────────────────────────────────────────

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
}

// ─── Payload for updateProduct (all fields optional) ─────────────────────────

export type UpdateProductPayload = Partial<CreateProductPayload>;

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  /** Base URL — driven by environment.apiUrl */
  private readonly apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Builds the Authorization header required by auth.middleware.js.
   * Reads the JWT stored in localStorage under the key 'token'.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  // ── Public API (mirrors product.controller.js) ─────────────────────────────

  /**
   * GET /api/products
   * Public — no auth required.
   * Supports: search, category, page, limit query params.
   * Backend validates: page ≥ 1, limit clamped to [1, 100].
   */
  getProducts(params: ProductQueryParams = {}): Observable<ProductsResponse> {
    let httpParams = new HttpParams();

    if (params.search)   httpParams = httpParams.set('search',   params.search);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.page)     httpParams = httpParams.set('page',     params.page.toString());
    if (params.limit)    httpParams = httpParams.set('limit',    params.limit.toString());

    return this.http.get<ProductsResponse>(this.apiUrl, { params: httpParams });
  }

  /**
   * GET /api/products/:id
   * Public — no auth required.
   * Backend uses validateObjectId middleware to reject malformed IDs.
   */
  getProductById(id: string): Observable<SingleProductResponse> {
    return this.http.get<SingleProductResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST /api/products
   * Protected — requires valid JWT (authentication) + admin role (authorize).
   * Required fields: name, category, price, stock.
   * price and stock must be ≥ 0.
   */
  createProduct(payload: CreateProductPayload): Observable<SingleProductResponse> {
    return this.http.post<SingleProductResponse>(
      this.apiUrl,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * PUT /api/products/:id
   * Protected — requires valid JWT (authentication) + admin role (authorize).
   * All fields optional; price and stock must be ≥ 0 if provided.
   */
  updateProduct(id: string, payload: UpdateProductPayload): Observable<SingleProductResponse> {
    return this.http.put<SingleProductResponse>(
      `${this.apiUrl}/${id}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * DELETE /api/products/:id
   * Protected — requires valid JWT (authentication) + admin role (authorize).
   */
  deleteProduct(id: string): Observable<DeleteProductResponse> {
    return this.http.delete<DeleteProductResponse>(
      `${this.apiUrl}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
