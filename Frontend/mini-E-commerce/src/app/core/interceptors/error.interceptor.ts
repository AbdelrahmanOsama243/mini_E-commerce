import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, filter, take, throwError, BehaviorSubject } from 'rxjs';
import { AuthService } from '../Services/auth-service';
import { ToastService } from '../../shared/toast/toast.service';

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't hijack auth endpoint errors (login/register/me/refresh) — let the caller handle them
      const isAuthEndpoint =
        req.url.includes('/login') ||
        req.url.includes('/register') ||
        req.url.endsWith('/me') ||
        req.url.includes('/refresh');

      if ([401, 403].includes(error.status) && !isAuthEndpoint) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap((tokenResponse: any) => {
              isRefreshing = false;
              const data = tokenResponse.data ?? tokenResponse;
              refreshTokenSubject.next(data.accessToken);

              const clonedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${data.accessToken}`,
                },
              });
              return next(clonedReq);
            }),
            catchError((err) => {
              isRefreshing = false;
              authService.clearSession(); // Using clearSession here as logout might trigger another API call
              toastService.showError('Authentication failed or session expired. Please log in.');
              router.navigate(['/login']);
              return throwError(() => err);
            }),
          );
        } else {
          return refreshTokenSubject.pipe(
            filter((token) => token != null),
            take(1),
            switchMap((jwt) => {
              const clonedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${jwt}`,
                },
              });
              return next(clonedReq);
            }),
          );
        }
      }

      // Display backend error message if available, except for 401s which are handled above
      if (![401, 403].includes(error.status) || isAuthEndpoint) {
        const errorMsg =
          error.error?.message ||
          error.message ||
          'An error occurred while communicating with the server.';
        toastService.showError(errorMsg);
      }
      return throwError(() => error);
    }),
  );
};
