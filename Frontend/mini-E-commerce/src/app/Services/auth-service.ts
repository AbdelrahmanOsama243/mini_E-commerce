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
  UpdateProfileResponse
} from '../../Models/iauth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = `${environment.apiUrl}/users`;

  private readonly TOKEN_KEY          = 'token';
  private readonly REFRESH_TOKEN_KEY  = 'refreshToken';
  private readonly USER_KEY           = 'user';

  constructor(private http: HttpClient) {}

  // ── Session helpers ────────────────────────────────────────────────────────

  /** Persist accessToken, refreshToken and user profile after login / register. */
  saveSession(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY,         response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY,          JSON.stringify(response.user));
  }

  /** Remove every auth key from localStorage. */
  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /** Return the stored access token, or null when not logged in. */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Return the stored refresh token, or null when not logged in. */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /** Return true when an access token is present in storage. */
  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getToken() ?? ''}`
    });
  }

  // ── Auth API ───────────────────────────────────────────────────────────────

  /** POST /api/users/register → 201 { user, accessToken, refreshToken } */
  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap(res => this.saveSession(res))
    );
  }

  /** POST /api/users/login → 200 { user, accessToken, refreshToken } */
  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap(res => this.saveSession(res))
    );
  }

  /**
   * POST /api/users/logout → 200 { message }
   * Sends the stored refreshToken in the body and clears the session on success.
   */
  logout(): Observable<LogoutResponse> {
    const payload: LogoutPayload = { refreshToken: this.getRefreshToken() ?? '' };
    return this.http.post<LogoutResponse>(
      `${this.apiUrl}/logout`,
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(() => this.clearSession())
    );
  }

  /** GET /api/users/me → 200 { _id, name, email, role } */
  getMe(): Observable<GetMeResponse> {
    return this.http.get<GetMeResponse>(
      `${this.apiUrl}/me`,
      { headers: this.getAuthHeaders() }
    );
  }

  /** PUT /api/users/me → 200 { _id, name, email, role } */
  updateProfile(payload: UpdateProfilePayload): Observable<UpdateProfileResponse> {
    return this.http.put<UpdateProfileResponse>(
      `${this.apiUrl}/me`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }
}
