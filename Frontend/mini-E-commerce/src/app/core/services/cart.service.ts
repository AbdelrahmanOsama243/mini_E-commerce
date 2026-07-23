import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, of, catchError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cart, CartResponse } from '../../models/cart.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/cart`;

  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  public cartCount$ = this.cart$.pipe(
    map(cart => {
      if (!cart || !cart.items) return 0;
      return cart.items.reduce((acc, item) => acc + item.quantity, 0);
    })
  );

  constructor() {
    // Automatically load cart when user logs in, and clear it when logged out
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadCart().subscribe();
      } else {
        this.cartSubject.next(null);
      }
    });
  }

  public get currentCartValue(): Cart | null {
    return this.cartSubject.value;
  }

  public loadCart(): Observable<Cart | null> {
    if (!this.authService.isLoggedIn()) {
      return of(null);
    }
    return this.http.get<CartResponse>(this.apiUrl).pipe(
      map(res => res.data),
      tap(cart => this.cartSubject.next(cart)),
      catchError(err => {
        // If 404 (Cart not found), we treat it as an empty cart
        if (err.status === 404) {
          const emptyCart: Cart = { userId: this.authService.currentUserValue?.id || '', items: [] };
          this.cartSubject.next(emptyCart);
          return of(emptyCart);
        }
        return of(null);
      })
    );
  }

  public addItem(productId: string, quantity: number): Observable<CartResponse> {
    return this.http.post<CartResponse>(this.apiUrl, { productId, quantity }).pipe(
      tap(res => {
        if (res && res.success) {
          this.cartSubject.next(res.data);
        }
      })
    );
  }

  public updateQuantity(itemId: string, quantity: number): Observable<CartResponse> {
    return this.http.put<CartResponse>(`${this.apiUrl}/${itemId}`, { quantity }).pipe(
      tap(res => {
        if (res && res.success) {
          this.cartSubject.next(res.data);
        }
      })
    );
  }

  public removeItem(itemId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.apiUrl}/${itemId}`).pipe(
      tap(res => {
        if (res && res.success) {
          this.cartSubject.next(res.data);
        }
      })
    );
  }

  public clearCart(): Observable<CartResponse> {
    return this.http.delete<CartResponse>(this.apiUrl).pipe(
      tap(res => {
        if (res && res.success) {
          this.cartSubject.next(res.data);
        }
      })
    );
  }
}
