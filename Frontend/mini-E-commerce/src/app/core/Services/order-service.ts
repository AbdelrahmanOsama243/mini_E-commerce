import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './environment';
import {
  OrderResponse,
  OrdersResponse,
  CreateOrderPayload,
  UpdateOrderStatusPayload
} from '../../Models/iorder';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  // ── Orders API ─────────────────────────────────────────────────────────────

  /**
   * POST /api/orders → 201 { success, message, data: Order }
   * Checkout: builds the order from the active cart, deducts stock, clears cart.
   */
  createOrder(payload: CreateOrderPayload): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(
      this.apiUrl,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * GET /api/orders → 200 { success, message, data: { items: Order[], total, page, limit } }
   * Users get their own orders.
   * Admins pass all=true to get every order in the system.
   * Supports pagination via page and limit params.
   */
  getOrders(all = false, page = 1, limit = 10): Observable<OrdersResponse> {
    let params = new HttpParams();
    if (all) params = params.set('all', 'true');
    params = params.set('page', page.toString());
    params = params.set('limit', limit.toString());

    return this.http.get<OrdersResponse>(
      this.apiUrl,
      { headers: this.getAuthHeaders(), params }
    );
  }

  /** GET /api/orders/:id → 200 { success, message, data: Order } */
  getOrderById(id: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(
      `${this.apiUrl}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * PUT /api/orders/:id/status → 200 { success, message, data: Order }
   * Admin only. Valid statuses: pending | processing | shipped | delivered.
   */
  updateOrderStatus(id: string, payload: UpdateOrderStatusPayload): Observable<OrderResponse> {
    return this.http.put<OrderResponse>(
      `${this.apiUrl}/${id}/status`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * POST /api/orders/:id/cancel → 200 { success, message, data: Order }
   * Users can cancel their own pending/paid orders.
   * Restores stock if order was already paid.
   */
  cancelOrder(id: string): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(
      `${this.apiUrl}/${id}/cancel`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }
}
