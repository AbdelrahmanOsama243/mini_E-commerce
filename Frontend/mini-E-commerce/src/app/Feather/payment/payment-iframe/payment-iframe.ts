import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PaymentService } from '../../../core/Services/payment.service';

@Component({
  selector: 'app-payment-iframe',
  standalone: false,
  template: `
    <div class="container mx-auto px-4 py-8 h-[80vh] flex flex-col relative">
      <h2 class="text-2xl font-black uppercase mb-4 text-center">Complete Payment</h2>
      <iframe *ngIf="safeUrl" [src]="safeUrl" class="w-full flex-grow border-2 border-primary brutalist-shadow" (load)="onIframeLoad()"></iframe>
      
      <div *ngIf="loading" class="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    </div>
  `
})
export class PaymentIframeComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private paymentService = inject(PaymentService);

  safeUrl: SafeResourceUrl | null = null;
  loading = true;
  private orderId: string | null = null;
  private pollInterval: any;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const url = params['url'];
      this.orderId = params['orderId'];
      
      if (url && this.orderId) {
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.startPolling();
      } else {
        this.router.navigate(['/cart']);
      }
    });
  }

  onIframeLoad() {
    this.loading = false;
  }

  startPolling() {
    if (!this.orderId) return;
    
    // Poll every 3 seconds to check payment status
    this.pollInterval = setInterval(() => {
      this.paymentService.getPaymentStatus(this.orderId!).subscribe({
        next: (res: any) => {
          const data = res?.data || res;
          const status = data?.status || data?.paymentStatus;
          const orderStatus = data?.orderStatus;

          if (status === 'paid' || orderStatus === 'processing') {
            clearInterval(this.pollInterval);
            this.router.navigate(['/payment/success']);
          } else if (status === 'failed' || orderStatus === 'payment_failed') {
            clearInterval(this.pollInterval);
            this.router.navigate(['/payment/failed']);
          }
        },
        error: (err) => console.warn('Payment polling status check:', err?.message || err)
      });
    }, 3000);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}
