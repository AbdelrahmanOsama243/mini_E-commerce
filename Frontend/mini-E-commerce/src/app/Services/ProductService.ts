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
} from '../../Models/iproduct';

export type { Product, ProductsResponse, SingleProductResponse, DeleteProductResponse, ProductQueryParams, CreateProductPayload, UpdateProductPayload };

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}


  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }


  getProducts(params: ProductQueryParams = {}): Observable<ProductsResponse> {
    let httpParams = new HttpParams();

    if (params.search)   httpParams = httpParams.set('search',   params.search);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.page)     httpParams = httpParams.set('page',     params.page.toString());
    if (params.limit)    httpParams = httpParams.set('limit',    params.limit.toString());

    return this.http.get<ProductsResponse>(this.apiUrl, { params: httpParams });
  }

  getProductById(id: string): Observable<SingleProductResponse> {
    return this.http.get<SingleProductResponse>(`${this.apiUrl}/${id}`);
  }

  createProduct(payload: CreateProductPayload): Observable<SingleProductResponse> {
    return this.http.post<SingleProductResponse>(
      this.apiUrl,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  updateProduct(id: string, payload: UpdateProductPayload): Observable<SingleProductResponse> {
    return this.http.put<SingleProductResponse>(
      `${this.apiUrl}/${id}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteProduct(id: string): Observable<DeleteProductResponse> {
    return this.http.delete<DeleteProductResponse>(
      `${this.apiUrl}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
