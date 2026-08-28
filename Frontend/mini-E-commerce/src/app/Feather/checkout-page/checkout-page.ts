import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/Services/cart-service';
import { Cart } from '../../Models/icart';
import { PaymentService } from '../../core/Services/payment.service';
import { AuthService } from '../../core/Services/auth-service';
import { ToastService } from '../../shared/toast/toast.service';
import { PaymentMethodType, SavedPaymentMethod } from '../../Models/ipayment';

@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.css',
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private paymentService = inject(PaymentService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  public cart = signal<Cart | null>(null);
  public loading = signal(false);
  public submitted = false;

  public selectedPaymentMethod = signal<PaymentMethodType>('card');
  public savedMethods = signal<SavedPaymentMethod[]>([]);
  public hasSavedMethods = signal(false);

  public checkoutForm: FormGroup;

  constructor() {
    this.checkoutForm = this.fb.group({
      shippingAddress: ['', [Validators.required, Validators.minLength(5)]],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\u0600-\u06FF\s]+$/)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\u0600-\u06FF\s]+$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^(010|011|012|015)[0-9]{8}$/)]],
      city: ['Cairo'],
      street: [''],
    });
  }

  ngOnInit() {
    this.cartService.getCart().subscribe({
      next: (res) => {
        if (res.success) {
          this.cart.set(res.data);
          if (!res.data.items || res.data.items.length === 0) {
            this.toastService.showInfo('Your cart is empty. Add items before checking out.');
            this.router.navigate(['/cart']);
          }
        }
      },
    });

    // Check if user has saved methods (for COD eligibility)
    this.paymentService.getSavedMethods().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          this.savedMethods.set(res.data);
          this.hasSavedMethods.set(true);
        }
      },
    });
  }

  get f() {
    return this.checkoutForm.controls;
  }

  selectMethod(method: PaymentMethodType) {
    if (method === 'cod' && !this.hasSavedMethods()) {
      this.toastService.showError('Cash on delivery requires at least one saved payment method.');
      return;
    }
    this.selectedPaymentMethod.set(method);
  }


  readonly SHIPPING_COST = 9.99;
  readonly TAX_RATE = 0.08;

  subtotal(): number {
    const currentCart = this.cart();
    if (!currentCart || !currentCart.items) return 0;
    return currentCart.items.reduce(
      (sum, item) => sum + (item.productId?.price || 0) * item.quantity,
      0
    );
  }

  tax(): number {
    return Number((this.subtotal() * this.TAX_RATE).toFixed(2));
  }

  shipping(): number {
    const currentCart = this.cart();
    return currentCart?.items?.length ? this.SHIPPING_COST : 0;
  }

  total(): number {
    return Number((this.subtotal() + this.shipping() + this.tax()).toFixed(2));
  }

  onSubmit() {
    this.submitted = true;

    if (!this.authService.isVerified()) {
      this.toastService.showError('You must verify your email before placing an order.');
      return;
    }

    if (this.checkoutForm.invalid) {
      this.toastService.showError('Please fill in all required fields correctly.');
      return;
    }

    this.loading.set(true);
    const formVal = this.checkoutForm.value;

    if (this.selectedPaymentMethod() === 'cod') {
      const payload = {
        shippingAddress: formVal.shippingAddress.trim(),
        billingData: {
          firstName: formVal.firstName.trim(),
          lastName: formVal.lastName.trim(),
          phone: formVal.phone.trim(),
        },
      };

      this.paymentService.initiateCOD(payload).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.toastService.showSuccess('Order placed successfully via Cash on Delivery!');
          this.router.navigate(['/orders']);
        },
        error: (err) => {
          this.loading.set(false);
          this.toastService.showError(err.error?.message || 'Failed to place COD order');
        },
      });
    } else {
      const payload = {
        paymentMethod: this.selectedPaymentMethod() as Exclude<PaymentMethodType, 'cod'>,
        shippingAddress: formVal.shippingAddress.trim(),
        billingData: {
          firstName: formVal.firstName.trim(),
          lastName: formVal.lastName.trim(),
          email: '', // Automatically supplied by backend from logged-in account
          phone: formVal.phone.trim(),
          city: formVal.city || 'Cairo',
          street: formVal.street || formVal.shippingAddress.trim(),
        },
        walletPhone: this.selectedPaymentMethod() === 'wallet' ? formVal.phone.trim() : undefined,
      };

      this.paymentService.initiatePayment(payload).subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.data) {
            const data = res.data;
            if (this.selectedPaymentMethod() === 'card' || this.selectedPaymentMethod() === 'valu') {
              this.router.navigate(['/payment/iframe'], {
                queryParams: { url: data.iframeUrl, orderId: data.orderId },
              });
            } else if (this.selectedPaymentMethod() === 'wallet') {
              window.location.href = data.redirectUrl!;
            } else if (this.selectedPaymentMethod() === 'kiosk') {
              this.router.navigate(['/payment/fawry-reference'], {
                queryParams: { ref: data.fawryReferenceNumber, orderId: data.orderId },
              });
            }
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.toastService.showError(err.error?.message || 'Failed to initiate payment');
        },
      });
    }
  }
}
