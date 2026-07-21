import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
} from '../Models/iauth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  // ── Auth API ───────────────────────────────────────────────────────────────

  /** POST /api/users/register → 201 { user, accessToken, refreshToken } */
  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload);
  }

  /** POST /api/users/login → 200 { user, accessToken, refreshToken } */
  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, payload);
  }

  /**
   * POST /api/users/logout → 200 { message }
   * Requires refreshToken in body; uses accessToken in header.
   */
  logout(payload: LogoutPayload): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(
      `${this.apiUrl}/logout`,
      payload,
      { headers: this.getAuthHeaders() }
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
