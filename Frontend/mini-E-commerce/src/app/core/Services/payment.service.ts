import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './environment';
import { 
  InitiatePaymentPayload, 
  InitiateCODPayload, 
  PaymentInitiateResponse, 
  PaymentStatusResponse, 
  SavedMethodsResponse,
  RefundPayload
} from '../../Models/ipayment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payment`;

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  initiatePayment(payload: InitiatePaymentPayload): Observable<PaymentInitiateResponse> {
    return this.http.post<PaymentInitiateResponse>(
      `${this.apiUrl}/initiate`, 
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  initiateCOD(payload: InitiateCODPayload): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/cod`, 
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  getPaymentStatus(orderId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(
      `${this.apiUrl}/status/${orderId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getSavedMethods(): Observable<SavedMethodsResponse> {
    return this.http.get<SavedMethodsResponse>(
      `${this.apiUrl}/methods`,
      { headers: this.getAuthHeaders() }
    );
  }

  refundPayment(payload: RefundPayload): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/refund`, 
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  voidPayment(orderId: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/void`, 
      { orderId },
      { headers: this.getAuthHeaders() }
    );
  }
}
