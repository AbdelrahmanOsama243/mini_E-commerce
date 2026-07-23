import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductsResponse, SingleProductResponse } from '../../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  public getProducts(
    search?: string,
    category?: string,
    page: number = 1,
    limit: number = 12
  ): Observable<ProductsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (category) {
      params = params.set('category', category);
    }

    return this.http.get<ProductsResponse>(this.apiUrl, { params });
  }

  public getProductById(id: string): Observable<SingleProductResponse> {
    return this.http.get<SingleProductResponse>(`${this.apiUrl}/${id}`);
  }

  public createProduct(product: Partial<Product>): Observable<SingleProductResponse> {
    return this.http.post<SingleProductResponse>(this.apiUrl, product);
  }

  public updateProduct(id: string, product: Partial<Product>): Observable<SingleProductResponse> {
    return this.http.put<SingleProductResponse>(`${this.apiUrl}/${id}`, product);
  }

  public deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
