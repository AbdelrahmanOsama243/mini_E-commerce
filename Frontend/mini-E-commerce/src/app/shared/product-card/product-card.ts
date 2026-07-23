import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <article class="bg-surface brutalist-border group flex flex-col relative h-full">
      <!-- Stock status badges -->
      @if (product.stock > 0 && product.stock <= 10) {
        <div class="absolute top-4 left-4 z-10 bg-secondary text-on-primary font-headline font-black uppercase px-3 py-1 border-2 border-primary transform -rotate-2">
          Low Stock
        </div>
      } @else if (product.stock === 0) {
        <div class="absolute top-4 left-4 z-10 bg-primary text-on-primary font-headline font-black uppercase px-3 py-1 border-2 border-primary transform rotate-1">
          Sold Out
        </div>
      }
      
      <!-- Product Image -->
      <a [routerLink]="['/products', product._id]" class="aspect-square border-b-2 border-primary overflow-hidden bg-surface-container relative block">
        <img 
          [src]="product.image || 'https://picsum.photos/seed/product/600/600'" 
          [alt]="product.name" 
          class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
        />
      </a>

      <!-- Product Details -->
      <div class="p-4 flex flex-col flex-1 justify-between bg-surface-bright">
        <div>
          <p class="text-xs font-headline font-bold uppercase text-on-surface-variant mb-1">
            {{ product.category }}
          </p>
          <a [routerLink]="['/products', product._id]" class="text-xl font-headline font-black uppercase leading-tight mb-2 hover:text-secondary transition-colors block">
            {{ product.name }}
          </a>
        </div>
        <div class="flex justify-between items-center mt-4 border-t-2 border-primary pt-4">
          <span class="text-2xl font-headline font-black">\${{ product.price }}</span>
          
          <button 
            (click)="addToCart($event)" 
            [disabled]="product.stock === 0"
            [title]="product.stock === 0 ? 'Out of Stock' : 'Add to Cart'"
            aria-label="Add to cart" 
            class="w-12 h-12 bg-primary text-on-primary border-2 border-primary flex items-center justify-center hover:bg-secondary hover:text-on-primary transition-colors brutalist-shadow-sm brutalist-shadow-hover-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="material-symbols-outlined text-2xl font-bold">add</span>
          </button>
        </div>
      </div>
    </article>
  `
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

    this.cartService.addItem(this.product._id!, 1).subscribe({
      next: () => {
        this.toastService.showSuccess(`${this.product.name} added to cart!`);
      },
      error: (err) => {
        // Handled by global error interceptor
      }
    });
  }
}
