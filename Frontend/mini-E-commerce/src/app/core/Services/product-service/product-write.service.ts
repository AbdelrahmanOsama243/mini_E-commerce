import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { getAuthHeaders } from './product-auth.util';
import {
  SingleProductResponse,
  DeleteProductResponse,
  CreateProductPayload,
  UpdateProductPayload
} from '../../../Models/iproduct';

@Injectable({
  providedIn: 'root'
})
export class ProductWriteService {
  private readonly apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  createProduct(payload: CreateProductPayload): Observable<SingleProductResponse> {
    return this.http.post<SingleProductResponse>(
      this.apiUrl,
      payload,
      { headers: getAuthHeaders() }
    );
  }

  updateProduct(id: string, payload: UpdateProductPayload): Observable<SingleProductResponse> {
    return this.http.put<SingleProductResponse>(
      `${this.apiUrl}/${id}`,
      payload,
      { headers: getAuthHeaders() }
    );
  }

  deleteProduct(id: string): Observable<DeleteProductResponse> {
    return this.http.delete<DeleteProductResponse>(
      `${this.apiUrl}/${id}`,
      { headers: getAuthHeaders() }
    );
  }
}
