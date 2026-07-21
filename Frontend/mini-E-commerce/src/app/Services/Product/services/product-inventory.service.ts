import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Product } from '../models/product.model';
import { StockCheckResult } from '../models/product-cart-relation.model';

@Injectable({
  providedIn: 'root'
})
export class ProductInventoryService {
  private readonly apiUrl = 'http://localhost:3000/api/products';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  /** Checks if a product has sufficient stock for a requested quantity */
  checkStock(productId: string, requestedQuantity: number): Observable<StockCheckResult> {
    return this.http.get<{ success: boolean; data: { stock: number; available: boolean } }>(
      `${this.apiUrl}/${productId}/stock`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(res => ({
        productId,
        available: res.data.stock >= requestedQuantity,
        requestedQuantity,
        currentStock: res.data.stock,
        message: res.data.stock < requestedQuantity 
          ? `Only ${res.data.stock} items remaining in stock` 
          : 'Stock available'
      }))
    );
  }

  /** Client-side helper to check if product is in stock */
  isInStock(product: Product, quantityNeeded: number = 1): boolean {
    return !!product && product.stock >= quantityNeeded;
  }
}
