import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  initiatePayment(payload: InitiatePaymentPayload): Observable<PaymentInitiateResponse> {
    return this.http.post<PaymentInitiateResponse>(
      `${this.apiUrl}/initiate`, 
      payload
    );
  }

  initiateCOD(payload: InitiateCODPayload): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/cod`, 
      payload
    );
  }

  getPaymentStatus(orderId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(
      `${this.apiUrl}/status/${orderId}`
    );
  }

  getSavedMethods(): Observable<SavedMethodsResponse> {
    return this.http.get<SavedMethodsResponse>(
      `${this.apiUrl}/methods`
    );
  }

  refundPayment(payload: RefundPayload): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/refund`, 
      payload
    );
  }

  voidPayment(orderId: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/void`, 
      { orderId }
    );
  }
}
