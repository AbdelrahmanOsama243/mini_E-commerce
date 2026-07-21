import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './environment';
import {
  Product,
  ProductsResponse,
  SingleProductResponse,
  DeleteProductResponse,
  ProductQueryParams,
  CreateProductPayload,
  UpdateProductPayload
} from '../Models/iproduct';

export type { Product, ProductsResponse, SingleProductResponse, DeleteProductResponse, ProductQueryParams, CreateProductPayload, UpdateProductPayload };

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** GET /api/products — public, supports search / category / page / limit */
  getProducts(params: ProductQueryParams = {}): Observable<ProductsResponse> {
    let httpParams = new HttpParams();

    if (params.search)   httpParams = httpParams.set('search',   params.search);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.page)     httpParams = httpParams.set('page',     params.page.toString());
    if (params.limit)    httpParams = httpParams.set('limit',    params.limit.toString());

    return this.http.get<ProductsResponse>(this.apiUrl, { params: httpParams });
  }

  /** GET /api/products/:id — public */
  getProductById(id: string): Observable<SingleProductResponse> {
    return this.http.get<SingleProductResponse>(`${this.apiUrl}/${id}`);
  }

  /** POST /api/products — admin only */
  createProduct(payload: CreateProductPayload): Observable<SingleProductResponse> {
    return this.http.post<SingleProductResponse>(
      this.apiUrl,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  /** PUT /api/products/:id — admin only */
  updateProduct(id: string, payload: UpdateProductPayload): Observable<SingleProductResponse> {
    return this.http.put<SingleProductResponse>(
      `${this.apiUrl}/${id}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  /** DELETE /api/products/:id — admin only */
  deleteProduct(id: string): Observable<DeleteProductResponse> {
    return this.http.delete<DeleteProductResponse>(
      `${this.apiUrl}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
