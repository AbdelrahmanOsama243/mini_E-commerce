import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ToastService } from '../shared/toast/toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private toastService = inject(ToastService);

  handleError(error: any): void {
    // Log to console for debugging
    console.error('Global error handler:', error);

    // Show user-friendly toast for unhandled errors
    const message = error?.message || 'An unexpected error occurred. Please try again.';
    this.toastService.showError(message);

    // Don't rethrow to avoid crashing the app
  }
}
