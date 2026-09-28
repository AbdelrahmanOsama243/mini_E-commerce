import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../Services/auth-service';

/**
 * Read a cookie value by name
 */
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

export const httpTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const accessToken = authService.getAccessToken();

  let headers = req.headers;
  if (accessToken) {
    headers = headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // CSRF protection — send the CSRF token from the cookie as a header
  // This is required when using cookie-based session authentication
  const csrfToken = getCookie('csrf_token') || getCookie('XSRF-TOKEN');
  if (csrfToken) {
    headers = headers.set('X-CSRF-TOKEN', csrfToken);
  }

  // Bypass ngrok's browser interstitial page that returns HTML instead of JSON
  headers = headers.set('ngrok-skip-browser-warning', 'true');

  // When using session cookies, we need to ensure withCredentials is true
  // so that the browser sends cookies with cross-origin requests.
  req = req.clone({
    headers,
    withCredentials: true
  });

  return next(req);
};
