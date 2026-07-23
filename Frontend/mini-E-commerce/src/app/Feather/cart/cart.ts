import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/Services/cart-service';
import { ToastService } from '../../shared/toast/toast.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner';
import { Cart, CartItem } from '../../Models/icart';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  public cart = signal<Cart | null>(null);
  public loading = signal(false);

  ngOnInit(): void {
    this.loadCart();
  }

  private loadCart(): void {
    this.loading.set(true);
    this.cartService.getCart().subscribe({
      next: (res) => {
        this.cart.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.cart.set(null);
        this.loading.set(false);
      },
    });
  }

  subtotal(): number {
    const currentCart = this.cart();
    if (!currentCart?.items?.length) return 0;
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

  updateQty(itemId: string, qty: number, stock: number) {
    if (qty <= 0) return;
    if (qty > stock) {
      this.toastService.showError(`Only ${stock} items left in stock.`);
      return;
    }

    this.loading.set(true);
    this.cartService.updateItem(itemId, { quantity: qty }).subscribe({
      next: (res) => {
        this.cart.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  removeItem(itemId: string) {
    this.loading.set(true);
    this.cartService.removeItem(itemId).subscribe({
      next: (res) => {
        this.cart.set(res.data);
        this.loading.set(false);
        this.toastService.showSuccess('Item removed from cart.');
      },
      error: () => this.loading.set(false),
    });
  }

  clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.loading.set(true);
      this.cartService.clearCart().subscribe({
        next: (res) => {
          this.cart.set(res.data);
          this.loading.set(false);
          this.toastService.showSuccess('Cart cleared.');
        },
        error: () => this.loading.set(false),
      });
    }
  }
}
