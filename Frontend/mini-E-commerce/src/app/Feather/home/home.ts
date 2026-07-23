import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ProductService } from '../../core/Services/ProductService';
import { CartService } from '../../core/Services/cart-service';
import { AuthService } from '../../core/Services/auth-service';
import { ToastService } from '../../shared/toast/toast.service';
import { Product } from '../../Models/iproduct';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  public featuredProducts = signal<Product[]>([]);
  public loading = signal(false);

  ngOnInit() {
    this.loading.set(true);
    // Fetch first 3 products for featured layout
    this.productService.getProducts({ search: '', category: '', page: 1, limit: 3 }).subscribe({
      next: (res: any) => {
        try {
          if (res && res.success) {
            const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
            this.featuredProducts.set(items);
          }
        } catch (e) {
          console.error('Error processing featured products', e);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching featured products', err);
        this.loading.set(false);
      },
    });
  }

  selectCategory(category: string) {
    this.router.navigate(['/products'], { queryParams: { category } });
  }

  addToCart(product: Product) {
    if (!this.authService.isLoggedIn()) {
      this.toastService.showInfo('Please log in to add items to your cart.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/` } });
      return;
    }

    if (product.stock <= 0) {
      this.toastService.showError('This item is currently out of stock.');
      return;
    }

    this.cartService.addItem({ productId: product._id!, quantity: 1 }).subscribe({
      next: () => {
        this.toastService.showSuccess(`${product.name} added to cart!`);
      },
    });
  }
}
