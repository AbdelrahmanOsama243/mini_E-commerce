import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddToCartPayload, CartResponse } from '../models/product-cart-relation.model';

@Injectable({
  providedIn: 'root'
})
export class ProductCartIntegrationService {
  private readonly cartApiUrl = 'http://localhost:3000/api/cart';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  /** Gets user's cart containing populated products */
  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(this.cartApiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  /** Adds product item to cart after server-side product stock verification */
  addProductToCart(payload: AddToCartPayload): Observable<CartResponse> {
    return this.http.post<CartResponse>(
      `${this.cartApiUrl}/items`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  /** Updates item quantity in cart */
  updateCartItem(productId: string, quantity: number): Observable<CartResponse> {
    return this.http.put<CartResponse>(
      `${this.cartApiUrl}/items/${productId}`,
      { quantity },
      { headers: this.getAuthHeaders() }
    );
  }

  /** Removes product item from cart */
  removeProductFromCart(productId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(
      `${this.cartApiUrl}/items/${productId}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
