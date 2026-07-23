import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: false,
  templateUrl: './toast.html'
})
export class ToastComponent {
  private toastService = inject(ToastService);
  public toasts$ = this.toastService.toasts$;

  remove(id: number) {
    this.toastService.remove(id);
  }
}
