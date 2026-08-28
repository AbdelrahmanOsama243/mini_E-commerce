import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-fawry-reference',
  standalone: false,
  template: `
    <div class="container mx-auto px-4 py-12 flex flex-col items-center min-h-[70vh] justify-center">
      <div class="bg-surface-container p-8 brutalist-border brutalist-shadow max-w-md w-full text-center">
        <span class="material-symbols-outlined text-7xl text-primary mb-4 block">storefront</span>
        <h2 class="font-headline text-3xl font-black uppercase mb-2 border-b-2 border-primary pb-2 inline-block">Fawry Payment</h2>
        <p class="text-on-surface-variant font-body mb-6 mt-4 font-medium">Please use this reference number to pay at any Fawry kiosk.</p>
        
        <div class="bg-background border-2 border-primary border-dashed p-6 mb-6 flex flex-col items-center">
          <span class="block text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-2">Reference Number</span>
          <span class="text-4xl font-mono font-black tracking-[0.2em] text-primary">{{ fawryRef }}</span>
        </div>
        
        <p class="text-sm font-body text-on-surface-variant mb-8 bg-surface-variant/30 p-3 rounded">
          <strong>Note:</strong> Valid for 24 hours. Your order will be processed once payment is confirmed.
        </p>
        
        <a routerLink="/orders" class="w-full block py-4 bg-primary text-on-primary font-headline font-black text-xl uppercase brutalist-button brutalist-shadow brutalist-shadow-hover transition-all">
          View My Orders
        </a>
      </div>
    </div>
  `
})
export class FawryReferenceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  fawryRef: string = '';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.fawryRef = params['ref'] || 'N/A';
    });
  }
}
