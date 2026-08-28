import { Component } from '@angular/core';

@Component({
  selector: 'app-payment-failed',
  standalone: false,
  template: `
    <div class="container mx-auto px-4 py-16 text-center flex flex-col items-center min-h-[70vh] justify-center">
      <div class="w-32 h-32 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-8 border-4 border-red-600 brutalist-shadow">
        <span class="material-symbols-outlined text-6xl">error</span>
      </div>
      
      <h1 class="font-headline text-5xl font-black mb-4 uppercase tracking-tight text-red-700">Payment Failed</h1>
      <p class="text-xl font-body text-on-surface-variant mb-10 max-w-lg">We couldn't process your payment. Your order was not completed. Please try again.</p>
      
      <div class="flex gap-4 flex-wrap justify-center">
        <a routerLink="/cart" class="px-8 py-4 bg-primary text-on-primary font-headline font-black text-xl uppercase brutalist-button brutalist-shadow brutalist-shadow-hover transition-all">
          Back to Cart
        </a>
        <a routerLink="/orders" class="px-8 py-4 bg-background text-primary border-4 border-primary font-headline font-black text-xl uppercase brutalist-button brutalist-shadow brutalist-shadow-hover transition-all">
          View Orders
        </a>
      </div>
    </div>
  `
})
export class PaymentFailedComponent {}
