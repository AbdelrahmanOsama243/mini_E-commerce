import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../Services/auth-service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../Services/environment';
import { catchError, map, of } from 'rxjs';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);

  if (authService.isLoggedIn()) {
    // Validate token by calling /users/me — if it fails, token is expired/invalid
    return http.get(`${environment.apiUrl}/users/me`).pipe(
      map(() => true),
      catchError(() => {
        authService.clearSession();
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return of(false);
      })
    );
  }

  // Redirect to login page with return url
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const AdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);

  if (authService.isAdmin()) {
    // Validate against backend in case role was changed server-side
    return http.get(`${environment.apiUrl}/users/me`).pipe(
      map((res: any) => {
        // API returns { success: true, data: { role: 'admin', ... } }
        const user = res?.data || res;
        if (user?.role === 'admin') {
          return true;
        }
        router.navigate(['/']);
        return false;
      }),
      catchError(() => {
        authService.clearSession();
        router.navigate(['/login']);
        return of(false);
      })
    );
  }

  // Redirect to home page
  router.navigate(['/']);
  return false;
};
