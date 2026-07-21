import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateOrderPayload, OrderResponse, OrderListResponse } from '../models/product-order-relation.model';

@Injectable({
  providedIn: 'root'
})
export class ProductOrderIntegrationService {
  private readonly ordersApiUrl = 'http://localhost:3000/api/orders';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  /**
   * Places an order for products in cart or specified product items.
   * Backend verifies product availability, snapshots priceAtPurchase from Product model,
   * decrements product stock, and resets cart.
   */
  createOrder(payload: CreateOrderPayload): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(
      this.ordersApiUrl,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  /** GET user's orders with populated product details */
  getUserOrders(): Observable<OrderListResponse> {
    return this.http.get<OrderListResponse>(this.ordersApiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  /** GET order details by ID */
  getOrderById(id: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.ordersApiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}
