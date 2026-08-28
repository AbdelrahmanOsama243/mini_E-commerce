import { Component } from '@angular/core';

@Component({
  selector: 'app-payment-success',
  standalone: false,
  template: `
    <div class="container mx-auto px-4 py-16 text-center flex flex-col items-center min-h-[70vh] justify-center">
      <div class="w-32 h-32 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 border-4 border-green-600 brutalist-shadow">
        <span class="material-symbols-outlined text-6xl">check_circle</span>
      </div>
      
      <h1 class="font-headline text-5xl font-black mb-4 uppercase tracking-tight text-green-700">Payment Successful!</h1>
      <p class="text-xl font-body text-on-surface-variant mb-10 max-w-lg">Your order has been paid and is now being processed by our team.</p>
      
      <div class="flex gap-4 flex-wrap justify-center">
        <a routerLink="/orders" class="px-8 py-4 bg-primary text-on-primary font-headline font-black text-xl uppercase brutalist-button brutalist-shadow brutalist-shadow-hover transition-all">
          View My Orders
        </a>
        <a routerLink="/" class="px-8 py-4 bg-background text-primary border-4 border-primary font-headline font-black text-xl uppercase brutalist-button brutalist-shadow brutalist-shadow-hover transition-all">
          Continue Shopping
        </a>
      </div>
    </div>
  `
})
export class PaymentSuccessComponent {}
