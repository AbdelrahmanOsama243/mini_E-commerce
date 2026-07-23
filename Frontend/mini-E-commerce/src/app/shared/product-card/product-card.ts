import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Product } from '../../Models/iproduct';
import { CartService } from '../../core/Services/cart-service';
import { AuthService } from '../../core/Services/auth-service';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-product-card',
  standalone: false,
  templateUrl: './product-card.html'
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  addToCart(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (!this.authService.isLoggedIn()) {
      this.toastService.showInfo('Please log in to add items to your cart.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/products/${this.product._id}` } });
      return;
    }

    if (this.product.stock <= 0) {
      this.toastService.showError('This item is currently out of stock.');
      return;
    }

    this.cartService.addItem({ productId: this.product._id!, quantity: 1 }).subscribe({
      next: () => {
        this.toastService.showSuccess(`${this.product.name} added to cart!`);
      },
      error: (err) => {
        // Handled by global error interceptor
      }
    });
  }
}
