import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './environment';
import {
  CartResponse,
  AddItemPayload,
  UpdateItemPayload
} from '../../Models/icart';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private readonly apiUrl = `${environment.apiUrl}/cart`;

  constructor(private http: HttpClient) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      return new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  // ── Cart API ───────────────────────────────────────────────────────────────

  /** GET /api/cart → 200 { success, message, data: Cart } */
  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(
      this.apiUrl,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * POST /api/cart → 200 | 201 { success, message, data: Cart }
   * 201 when item is new, 200 when quantity is merged with existing.
   */
  addItem(payload: AddItemPayload): Observable<CartResponse> {
    return this.http.post<CartResponse>(
      this.apiUrl,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  /** PUT /api/cart/:itemId → 200 { success, message, data: Cart } */
  updateItem(itemId: string, payload: UpdateItemPayload): Observable<CartResponse> {
    return this.http.put<CartResponse>(
      `${this.apiUrl}/${itemId}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  /** DELETE /api/cart/:itemId → 200 { success, message, data: Cart } */
  removeItem(itemId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(
      `${this.apiUrl}/${itemId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /** DELETE /api/cart → 200 { success, message, data: Cart } */
  clearCart(): Observable<CartResponse> {
    return this.http.delete<CartResponse>(
      this.apiUrl,
      { headers: this.getAuthHeaders() }
    );
  }
}
