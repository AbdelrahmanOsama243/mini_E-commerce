import { Component, OnInit, inject, signal } from '@angular/core';
import { Cart as CartModel, CartItem } from '../Models/icart';
import { CartService } from '../Services/cart-service';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent implements OnInit {
  private readonly cartService = inject(CartService)

  loading = signal(false);
  error = signal<string | null>(null)
  cart = signal<CartModel | null>(null)

  ngOnInit(): void {
    this.loadCart()
  }

  private loadCart(): void {
    this.loading.set(true)
    this.error.set(null)

    this.cartService.getCart().subscribe({
      next: (res) => {
        this.cart.set(res.data)
        this.loading.set(false)
      },
      error: (err) => {
        this.loading.set(false)
        this.cart.set(null);
        this.error.set(err?.error?.message ?? 'Failed to load cart')
      }
    })
  }

  totalPrice(): number {
    const current = this.cart();
    if (!current?.items?.length) return 0;
    return current.items.reduce((sum, item) => {
      const price = item.productId?.price ?? 0;
      return sum + price * item.quantity;
    }, 0)
  }

  onQuantityChange(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const quantity = input?.valueAsNumber;
    if (!Number.isFinite(quantity) || quantity == null || quantity < 1) return

    this.cartService.updateItem(item._id, { quantity }).subscribe({
      next: (res) => this.cart.set(res.data),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to update quantity')
      }
    })
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item._id).subscribe({
      next: (res) => this.cart.set(res.data),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to remove item')
      }
    })
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe({
      next: (res) => this.cart.set(res.data),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to clear cart')
      }
    })
  }
}
