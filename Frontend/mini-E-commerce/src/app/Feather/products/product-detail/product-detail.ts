import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../core/Services/ProductService';
import { CartService } from '../../../core/Services/cart-service';
import { AuthService } from '../../../core/Services/auth-service';
import { ToastService } from '../../../shared/toast/toast.service';
import { Product } from '../../../Models/iproduct';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailComponent implements OnInit {
  @Input() id!: string; // Route parameter bound automatically

  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  public product = signal<Product | null>(null);
  public loading = signal(false);
  public quantity = signal(1);

  ngOnInit() {
    if (this.id) {
      this.loadProduct();
    }
  }

  loadProduct() {
    this.loading.set(true);
    this.productService.getProductById(this.id).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.product.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.showError('Product could not be loaded.');
        this.router.navigate(['/products']);
      },
    });
  }

  increaseQty(stock: number) {
    if (this.quantity() < stock) {
      this.quantity.update((q) => q + 1);
    }
  }

  decreaseQty() {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  addToCart() {
    const prod = this.product();
    if (!prod) return;

    this.cartService.addItem({ productId: prod._id!, quantity: this.quantity() }).subscribe({
      next: () => {
        this.toastService.showSuccess(`${this.quantity()} ${prod.name} added to cart!`);
      },
    });
  }
}
