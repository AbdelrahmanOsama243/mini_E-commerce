import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <app-loading-spinner [visible]="loading()"></app-loading-spinner>
    
    <main class="flex-grow container mx-auto px-6 py-12 max-w-5xl flex flex-col gap-6">
      <a routerLink="/cart" class="font-headline font-bold uppercase text-sm hover:text-secondary flex items-center gap-2 self-start">
        <span class="material-symbols-outlined text-lg">arrow_back</span>
        Back to cart
      </a>

      <h1 class="font-headline text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 border-b-4 border-primary pb-4">
        Checkout
      </h1>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <!-- Address Form (Left Column) -->
        <section class="lg:col-span-7 flex flex-col gap-6">
          <div class="bg-surface-container brutalist-border p-8 brutalist-shadow">
            <h3 class="font-headline font-black text-2xl uppercase mb-6 border-b-2 border-primary pb-2">
              Shipping Address
            </h3>

            <form [formGroup]="addressForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label for="address" class="font-headline font-bold uppercase tracking-tight text-sm">
                  Street Address
                </label>
                <textarea 
                  id="address" 
                  formControlName="shippingAddress"
                  rows="3"
                  class="brutalist-border p-3 font-body bg-background focus:ring-0 focus:border-secondary outline-none text-sm"
                  placeholder="e.g. 123 Designer Street, New Cairo, Egypt"
                ></textarea>
                @if (submitted && f['shippingAddress'].errors) {
                  <span class="text-secondary font-bold text-xs uppercase tracking-tight">
                    Shipping address is required to place your order.
                  </span>
                }
              </div>

              <!-- Place Order Button -->
              <button 
                type="submit" 
                class="w-full py-4 bg-primary text-on-primary text-xl brutalist-button brutalist-shadow brutalist-shadow-hover"
              >
                Place Order
              </button>
            </form>
          </div>
        </section>

        <!-- Order Summary Review (Right Column) -->
        <aside class="lg:col-span-5 w-full">
          <div class="bg-surface-container-high border-4 border-primary p-6 brutalist-shadow flex flex-col gap-6">
            <h3 class="font-headline font-black text-2xl uppercase border-b-2 border-primary pb-2">
              Review Order
            </h3>

            <!-- Item Rows -->
            <div class="flex flex-col gap-4 max-h-64 overflow-y-auto pr-2">
              @for (item of cart()?.items; track item._id) {
                @if (item.productId) {
                  <div class="flex justify-between items-center border-b border-primary/20 pb-3 font-headline text-sm">
                    <div class="flex flex-col">
                      <span class="font-black uppercase tracking-tight">{{ item.productId.name }}</span>
                      <span class="font-body text-xs text-on-surface-variant font-medium">Qty: {{ item.quantity }}</span>
                    </div>
                    <span class="font-black">\${{ item.productId.price * item.quantity }}</span>
                  </div>
                }
              }
            </div>

            <!-- Price Calculations -->
            <div class="flex flex-col gap-3 font-headline font-bold text-sm border-t-2 border-primary pt-4">
              <div class="flex justify-between">
                <span class="uppercase opacity-70">Subtotal</span>
                <span>\${{ subtotal() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="uppercase opacity-70">Shipping</span>
                <span>\${{ shipping() }}</span>
              </div>
              <div class="border-t-2 border-primary pt-3 flex justify-between text-lg font-black">
                <span class="uppercase">Total</span>
                <span>\${{ total() }}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  `
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  public cart = toSignal(this.cartService.cart$, { initialValue: null });
  public addressForm: FormGroup;
  public loading = signal(false);
  public submitted = false;

  constructor() {
    this.addressForm = this.fb.group({
      shippingAddress: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit() {
    // If cart is empty, redirect to cart page
    const currentCart = this.cartService.currentCartValue;
    if (currentCart && currentCart.items.length === 0) {
      this.toastService.showInfo('Your cart is empty. Add items before checking out.');
      this.router.navigate(['/cart']);
    }
  }

  get f() {
    return this.addressForm.controls;
  }

  subtotal(): number {
    const currentCart = this.cartService.currentCartValue;
    if (!currentCart || !currentCart.items) return 0;
    return currentCart.items.reduce((sum, item) => {
      return sum + (item.productId ? item.productId.price * item.quantity : 0);
    }, 0);
  }

  shipping(): number {
    return this.subtotal() > 150 ? 0 : 10;
  }

  total(): number {
    return this.subtotal() + this.shipping();
  }

  onSubmit() {
    this.submitted = true;

    if (this.addressForm.invalid) {
      return;
    }

    const { shippingAddress } = this.addressForm.value;
    
    this.loading.set(true);
    this.orderService.checkout(shippingAddress).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastService.showSuccess('Order placed successfully!');
        
        // Reload cart
        this.cartService.loadCart().subscribe();
        
        // Redirect to orders
        this.router.navigate(['/orders']);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
