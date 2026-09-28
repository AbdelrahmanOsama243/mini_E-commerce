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

/**
 * Token refresh state management class
 * Encapsulates the refresh flag and subject to avoid module-level mutable state
 */
class RefreshState {
  private _isRefreshing = false;
  private _subject = new BehaviorSubject<string | null>(null);

  get isRefreshing(): boolean {
    return this._isRefreshing;
  }

  set isRefreshing(value: boolean) {
    this._isRefreshing = value;
  }

  get subject(): BehaviorSubject<string | null> {
    return this._subject;
  }

  reset(): void {
    this._isRefreshing = false;
    this._subject.next(null);
  }
}

const refreshState = new RefreshState();

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
        if (!refreshState.isRefreshing) {
          refreshState.isRefreshing = true;
          refreshState.reset();

          return authService.refreshToken().pipe(
            switchMap(() => {
              refreshState.isRefreshing = false;
              const newAccessToken = authService.getAccessToken();
              if (newAccessToken) {
                refreshState.subject.next(newAccessToken);
              }

              const clonedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newAccessToken || ''}`,
                },
              });
              return next(clonedReq);
            }),
            catchError((err) => {
              refreshState.isRefreshing = false;
              authService.clearSession();
              toastService.showError('Authentication failed or session expired. Please log in.');
              router.navigate(['/login']);
              return throwError(() => err);
            }),
          );
        } else {
          return refreshState.subject.pipe(
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
      // Also, silently ignore errors from the /refresh endpoint to avoid spamming guests on startup.
      const isSilentRefreshError = req.url.includes('/refresh');
      
      if ((![401, 403].includes(error.status) || isAuthEndpoint) && !isSilentRefreshError) {
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
