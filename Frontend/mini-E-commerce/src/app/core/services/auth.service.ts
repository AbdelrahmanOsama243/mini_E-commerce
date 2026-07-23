import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    const token = this.getToken();
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        // Restore user from localStorage — no backend call needed
        this.currentUserSubject.next(JSON.parse(storedUser));
      } catch (e) {
        // Only clear if localStorage data is corrupted
        this.clearSession();
      }
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUserValue;
  }

  public isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }

  public login(credentials: { email: string; password?: string }): Observable<AuthResponse> {
    const payload = {
      ...credentials,
      email: credentials.email.trim().toLowerCase()
    };
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap(response => {
        if (response && response.accessToken) {
          this.saveSession(response.accessToken, response.refreshToken, response.user);
        }
      })
    );
  }

  public register(user: { name: string; email: string; password?: string }): Observable<AuthResponse> {
    const payload = {
      ...user,
      email: user.email.trim().toLowerCase()
    };
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap(response => {
        if (response && response.accessToken) {
          this.saveSession(response.accessToken, response.refreshToken, response.user);
        }
      })
    );
  }

  public fetchMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        if (user) {
          const normalizedUser = {
            ...user,
            id: user.id || user._id
          };
          this.currentUserSubject.next(normalizedUser);
          localStorage.setItem('user', JSON.stringify(normalizedUser));
        }
      }),
      catchError(err => {
        // Don't logout — just silently fail. The session stays alive from localStorage.
        // A real 401 on a protected API call will be handled by the error interceptor.
        return of(err);
      })
    );
  }

  public logout(): void {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    this.clearSession();
  }

  private saveSession(accessToken: string, refreshToken: string, user: User) {
    const normalizedUser = {
      ...user,
      id: user.id || user._id
    };
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    this.currentUserSubject.next(normalizedUser);
  }

  private clearSession() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  public getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  public refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(response => {
        if (response && response.accessToken) {
          // Refresh endpoints often omit the user object. Fallback to current user to prevent crash.
          const userToSave = response.user || this.currentUserValue;
          this.saveSession(
            response.accessToken, 
            response.refreshToken || refreshToken!, 
            userToSave!
          );
        }
      })
    );
  }
}
