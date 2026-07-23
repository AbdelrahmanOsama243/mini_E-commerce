import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CartService } from '../../core/Services/cart-service';
import { Cart } from '../../Models/icart';
import { OrderService } from '../../core/Services/order-service';
import { ToastService } from '../../shared/toast/toast.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.css',
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  public cart = signal<Cart | null>(null);
  public addressForm: FormGroup;
  public loading = signal(false);
  public submitted = false;

  constructor() {
    this.addressForm = this.fb.group({
      shippingAddress: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  ngOnInit() {
    this.cartService.getCart().subscribe({
      next: (res) => {
        if (res.success) {
          this.cart.set(res.data);
          if (res.data.items.length === 0) {
            this.toastService.showInfo('Your cart is empty. Add items before checking out.');
            this.router.navigate(['/cart']);
          }
        }
      }
    });
  }

  get f() {
    return this.addressForm.controls;
  }

  subtotal(): number {
    const currentCart = this.cart();
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
    this.orderService.createOrder({ shippingAddress }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastService.showSuccess('Order placed successfully!');

        // Redirect to orders
        this.router.navigate(['/orders']);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
