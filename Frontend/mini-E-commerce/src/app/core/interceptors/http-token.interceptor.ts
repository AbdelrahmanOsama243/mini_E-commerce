import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../Services/auth-service';

export const httpTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const accessToken = authService.getAccessToken();

  let headers = req.headers;
  if (accessToken) {
    headers = headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // When using session cookies, we need to ensure withCredentials is true
  // so that the browser sends cookies with cross-origin requests.
  req = req.clone({
    headers,
    withCredentials: true
  });

  return next(req);
};
