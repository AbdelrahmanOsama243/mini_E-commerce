import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-24 right-6 z-[9999] flex flex-col gap-4 max-w-sm w-full">
      @for (toast of toasts$ | async; track toast.id) {
        <div 
          class="brutalist-border p-4 shadow-[4px_4px_0px_0px_#1a1a1a] flex justify-between items-center transition-all duration-300"
          [ngClass]="{
            'bg-secondary text-on-primary': toast.type === 'error',
            'bg-primary-container text-primary': toast.type === 'success',
            'bg-surface-container text-primary': toast.type === 'info'
          }"
        >
          <div class="flex items-center gap-3 font-headline font-bold uppercase tracking-tight">
            @if (toast.type === 'error') {
              <span class="material-symbols-outlined font-bold">error</span>
            } @else if (toast.type === 'success') {
              <span class="material-symbols-outlined font-bold">check_circle</span>
            } @else {
              <span class="material-symbols-outlined font-bold">info</span>
            }
            <span class="text-sm font-semibold tracking-tight">{{ toast.text }}</span>
          </div>
          <button 
            (click)="remove(toast.id)" 
            class="text-current hover:opacity-80 p-1 flex items-center justify-center shrink-0 ml-4"
            aria-label="Close"
          >
            <span class="material-symbols-outlined font-bold text-lg">close</span>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  private toastService = inject(ToastService);
  public toasts$ = this.toastService.toasts$;

  remove(id: number) {
    this.toastService.remove(id);
  }
}
