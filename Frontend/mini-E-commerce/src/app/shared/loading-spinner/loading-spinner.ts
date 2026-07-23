import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-[999] flex flex-col justify-center items-center gap-6">
        <!-- Bauhaus Rotating Geometric Blocks -->
        <div class="relative w-16 h-16 flex items-center justify-center">
          <div class="absolute w-12 h-12 brutalist-border bg-primary-container animate-spin duration-1000"></div>
          <div class="absolute w-8 h-8 brutalist-border bg-secondary animate-ping duration-1500"></div>
        </div>
        <span class="font-headline font-black uppercase text-xl tracking-widest text-primary animate-pulse">
          Loading...
        </span>
      </div>
    }
  `
})
export class LoadingSpinnerComponent {
  @Input() visible: boolean = false;
}
