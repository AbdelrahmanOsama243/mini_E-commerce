import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../Services/auth-service';

export const httpTokenInterceptor: HttpInterceptorFn = (req, next) => {
  // When using session cookies, we need to ensure withCredentials is true
  // so that the browser sends cookies with cross-origin requests.
  req = req.clone({
    withCredentials: true
  });

  return next(req);
};
