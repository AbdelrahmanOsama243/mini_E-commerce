import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of, switchMap } from 'rxjs';
import { environment } from './environment';
import {
  RegisterPayload,
  LoginPayload,
  LogoutPayload,
  UpdateProfilePayload,
  AuthResponse,
  LoginResponse,
  LogoutResponse,
  GetMeResponse,
  UpdateProfileResponse,
  User
} from '../../Models/iauth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = `${environment.apiUrl}/users`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private currentAccessToken: string | null = null;

  constructor(private http: HttpClient) {
    this.restoreLocalSession();
  }

  /** Synchronously restore session from localStorage on app boot */
  private restoreLocalSession(): void {
    try {
      const savedUser = localStorage.getItem('auth_user');
      const savedToken = localStorage.getItem('access_token');
      if (savedUser && savedToken) {
        this.currentAccessToken = savedToken;
        this.currentUserSubject.next(JSON.parse(savedUser));
      }
    } catch {
      this.clearSession();
    }
  }

  /** Try to refresh session on startup */
  initAuth(): Observable<any> {
    const storedRefreshToken = localStorage.getItem('refresh_token');
    const storedToken = localStorage.getItem('access_token');
    
    // If no stored credentials at all, return null
    if (!storedRefreshToken && !storedToken) {
      return of(null);
    }
    
    return this.refreshToken();
  }

  /** Get current access token from memory or localStorage */
  getAccessToken(): string | null {
    if (!this.currentAccessToken) {
      this.currentAccessToken = localStorage.getItem('access_token');
    }
    return this.currentAccessToken;
  }

  /** Persist user profile and token in memory and localStorage after login / register. */
  saveSession(user: User, accessToken: string, refreshToken?: string): void {
    this.currentAccessToken = accessToken;
    this.currentUserSubject.next(user);
    try {
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
    } catch (e) {
      console.warn('Failed to save auth session to localStorage', e);
    }
  }

  /** Remove auth keys from memory and localStorage. */
  clearSession(): void {
    this.currentAccessToken = null;
    this.currentUserSubject.next(null);
    try {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch {}
  }

  /** Return true when a user profile is present in memory or localStorage. */
  isLoggedIn(): boolean {
    if (this.currentUserSubject.value !== null) {
      return true;
    }
    const savedUser = localStorage.getItem('auth_user');
    const savedToken = localStorage.getItem('access_token');
    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        this.currentAccessToken = savedToken;
        this.currentUserSubject.next(parsed);
        return true;
      } catch {}
    }
    return false;
  }

  /** Return the stored user profile, or null when not logged in. */
  getUser(): User | null {
    if (!this.currentUserSubject.value) {
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          this.currentUserSubject.next(parsed);
          return parsed;
        } catch {}
      }
    }
    return this.currentUserSubject.value;
  }

  /** Return true if the logged in user is an admin. */
  isAdmin(): boolean {
    const user = this.getUser();
    return user !== null && user.role === 'admin';
  }

  /** Return true if the logged in user has verified their email. */
  isVerified(): boolean {
    const user = this.getUser();
    return user !== null && user.isVerified === true;
  }


  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }



  /** POST /api/users/register → 201 { success, message } */
  register(payload: RegisterPayload): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/register`, payload);
  }

  /** POST /api/users/login → 200 { success, message, data: { user, accessToken, refreshToken } } */
  login(payload: LoginPayload): Observable<{ success: boolean; message: string; data: LoginResponse }> {
    return this.http.post<{ success: boolean; message: string; data: LoginResponse }>(
      `${this.apiUrl}/login`,
      payload,
      { withCredentials: true }
    ).pipe(
      tap(res => this.saveSession(res.data.user, res.data.accessToken, res.data.refreshToken))
    );
  }

  /**
   * POST /api/users/logout → 200 { message }
   */
  logout(): Observable<LogoutResponse> {
    const storedRefreshToken = localStorage.getItem('refresh_token');
    return this.http.post<LogoutResponse>(
      `${this.apiUrl}/logout`,
      { refreshToken: storedRefreshToken || undefined },
      { headers: this.getAuthHeaders(), withCredentials: true }
    ).pipe(
      tap(() => this.clearSession())
    );
  }

  /** POST /api/users/refresh */
  refreshToken(token?: string): Observable<any> {
    const tokenToSend = token || localStorage.getItem('refresh_token');
    const body = tokenToSend ? { refreshToken: tokenToSend } : {};

    return this.http.post<any>(`${this.apiUrl}/refresh`, body, { withCredentials: true }).pipe(
      tap((res: any) => {
        if (res?.data?.accessToken) {
          this.currentAccessToken = res.data.accessToken;
          localStorage.setItem('access_token', res.data.accessToken);
          if (res.data.refreshToken) {
            localStorage.setItem('refresh_token', res.data.refreshToken);
          }
        }
      }),
      switchMap((res: any) => {
        if (res?.data?.accessToken) {
          return this.getMe().pipe(
            tap((meRes) => {
              if (meRes?.data) {
                this.currentUserSubject.next(meRes.data as unknown as User);
                localStorage.setItem('auth_user', JSON.stringify(meRes.data));
              }
            }),
            catchError(() => of(null))
          );
        }
        return of(null);
      }),
      catchError(() => {
        // If refresh fails and token was expired/invalid, clear session
        this.clearSession();
        return of(null);
      })
    );
  }

  /** GET /api/users/me → 200 { success, message, data: { _id, name, email, role } } */
  getMe(): Observable<{ success: boolean; message: string; data: GetMeResponse }> {
    return this.http.get<{ success: boolean; message: string; data: GetMeResponse }>(
      `${this.apiUrl}/me`,
      { headers: this.getAuthHeaders() }
    );
  }

  /** PUT /api/users/me → 200 { success, message, data: { _id, name, email, role } } */
  updateProfile(payload: UpdateProfilePayload): Observable<{ success: boolean; message: string; data: UpdateProfileResponse }> {
    return this.http.put<{ success: boolean; message: string; data: UpdateProfileResponse }>(
      `${this.apiUrl}/me`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  /** GET /api/users/verify-email/:token */
  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.apiUrl}/verify-email/${token}`);
  }

  /** POST /api/users/forget-password */
  forgetPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/forget-password`, { email });
  }

  /** POST /api/users/reset-password/:token */
  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password/${token}`, { password });
  }

  /** POST /api/users/resend-verification */
  resendVerification(payload: RegisterPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/resend-verification`, payload);
  }
}
