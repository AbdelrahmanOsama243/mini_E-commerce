import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, timeout, throwError } from 'rxjs';
import { ToastService } from '../../shared/toast/toast.service';

const DEFAULT_TIMEOUT = 30000; // 30 seconds

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    timeout(DEFAULT_TIMEOUT),
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 0) {
        toastService.showError('Request timed out. Please check your connection and try again.');
      }
      return throwError(() => error);
    })
  );
};
