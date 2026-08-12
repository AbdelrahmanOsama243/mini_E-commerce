import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
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

  private readonly USER_KEY = 'user';

  constructor(private http: HttpClient) {}

  /** Persist user profile after login / register. */
  saveSession(response: AuthResponse): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
  }

  /** Remove auth keys from localStorage. */
  clearSession(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  /** Return true when a user profile is present in storage. */
  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }

  /** Return the stored user profile, or null when not logged in. */
  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
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
    return this.http.post<{ success: boolean; message: string; data: LoginResponse }>(`${this.apiUrl}/login`, payload).pipe(
      tap(res => this.saveSession(res.data))
    );
  }

  /**
   * POST /api/users/logout → 200 { message }
   * The backend will read the refreshToken from the session.
   */
  logout(): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(
      `${this.apiUrl}/logout`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(() => this.clearSession())
    );
  }

  /** POST /api/users/refresh */
  refreshToken(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/refresh`, {}).pipe(
      tap((res: any) => {
        // Tokens are managed via cookies, so no local storage updates needed
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

  /** POST /api/users/resend-verification */
  resendVerification(payload: RegisterPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/resend-verification`, payload);
  }
}
