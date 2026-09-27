import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './environment';
import {
  UserOrderStats,
  ChartDataPoint,
  AdminOverview,
  AdminProductRanking,
  LowStockProduct,
  TopCustomer,
  AnalyticsApiResponse
} from '../../Models/ianalytics';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  // ── User Analytics ─────────────────────────────────────────────────────────

  /** GET /api/analytics/user/stats */
  getUserStats(): Observable<AnalyticsApiResponse<UserOrderStats>> {
    return this.http.get<AnalyticsApiResponse<UserOrderStats>>(
      `${this.apiUrl}/user/stats`,
      { headers: this.getAuthHeaders() }
    );
  }

  /** GET /api/analytics/user/by-status */
  getUserOrdersByStatus(): Observable<AnalyticsApiResponse<ChartDataPoint[]>> {
    return this.http.get<AnalyticsApiResponse<ChartDataPoint[]>>(
      `${this.apiUrl}/user/by-status`,
      { headers: this.getAuthHeaders() }
    );
  }

  /** GET /api/analytics/user/spending */
  getUserSpendingTimeline(): Observable<AnalyticsApiResponse<ChartDataPoint[]>> {
    return this.http.get<AnalyticsApiResponse<ChartDataPoint[]>>(
      `${this.apiUrl}/user/spending`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ── Admin Analytics (Scoped per logged-in admin) ───────────────────────────

  /** GET /api/analytics/admin/overview */
  getAdminOverview(): Observable<AnalyticsApiResponse<AdminOverview>> {
    return this.http.get<AnalyticsApiResponse<AdminOverview>>(
      `${this.apiUrl}/admin/overview`,
      { headers: this.getAuthHeaders() }
    );
  }

  /** GET /api/analytics/admin/top-products */
  getAdminTopProducts(limit = 10): Observable<AnalyticsApiResponse<AdminProductRanking[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<AnalyticsApiResponse<AdminProductRanking[]>>(
      `${this.apiUrl}/admin/top-products`,
      { headers: this.getAuthHeaders(), params }
    );
  }

  /** GET /api/analytics/admin/least-products */
  getAdminLeastProducts(limit = 10): Observable<AnalyticsApiResponse<AdminProductRanking[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<AnalyticsApiResponse<AdminProductRanking[]>>(
      `${this.apiUrl}/admin/least-products`,
      { headers: this.getAuthHeaders(), params }
    );
  }

  /** GET /api/analytics/admin/low-stock */
  getAdminLowStock(threshold = 5): Observable<AnalyticsApiResponse<LowStockProduct[]>> {
    const params = new HttpParams().set('threshold', threshold.toString());
    return this.http.get<AnalyticsApiResponse<LowStockProduct[]>>(
      `${this.apiUrl}/admin/low-stock`,
      { headers: this.getAuthHeaders(), params }
    );
  }

  /** GET /api/analytics/admin/revenue */
  getAdminRevenueTimeline(): Observable<AnalyticsApiResponse<ChartDataPoint[]>> {
    return this.http.get<AnalyticsApiResponse<ChartDataPoint[]>>(
      `${this.apiUrl}/admin/revenue`,
      { headers: this.getAuthHeaders() }
    );
  }

  /** GET /api/analytics/admin/payment-stats */
  getAdminPaymentStats(): Observable<AnalyticsApiResponse<ChartDataPoint[]>> {
    return this.http.get<AnalyticsApiResponse<ChartDataPoint[]>>(
      `${this.apiUrl}/admin/payment-stats`,
      { headers: this.getAuthHeaders() }
    );
  }

  /** GET /api/analytics/admin/top-customers */
  getAdminTopCustomers(limit = 10): Observable<AnalyticsApiResponse<TopCustomer[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<AnalyticsApiResponse<TopCustomer[]>>(
      `${this.apiUrl}/admin/top-customers`,
      { headers: this.getAuthHeaders(), params }
    );
  }

  /** Get configured Looker Studio Embed URL */
  getLookerEmbedUrl(): string {
    return environment.lookerStudioReportUrl || '';
  }
}
