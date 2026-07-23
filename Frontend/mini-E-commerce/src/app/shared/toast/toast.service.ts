import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$ = this.toastsSubject.asObservable();
  private nextId = 0;

  show(text: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 4000) {
    const id = this.nextId++;
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, { id, text, type }]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  showSuccess(text: string, duration?: number) {
    this.show(text, 'success', duration);
  }

  showError(text: string, duration?: number) {
    this.show(text, 'error', duration);
  }

  showInfo(text: string, duration?: number) {
    this.show(text, 'info', duration);
  }

  remove(id: number) {
    const filtered = this.toastsSubject.value.filter(t => t.id !== id);
    this.toastsSubject.next(filtered);
  }
}
