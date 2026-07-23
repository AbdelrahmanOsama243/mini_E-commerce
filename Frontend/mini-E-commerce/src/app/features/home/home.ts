import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Product } from '../../models/product.model';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <app-loading-spinner [visible]="loading()"></app-loading-spinner>
    
    <!-- Hero Section -->
    <section class="relative w-full overflow-hidden border-b-4 border-primary bg-surface-container-low">
      <!-- Geometric Background Pattern -->
      <div class="absolute inset-0 z-0 flex flex-wrap opacity-25 pointer-events-none">
        <div class="w-1/2 h-1/2 bg-primary-container"></div>
        <div class="w-1/2 h-1/2 bg-secondary"></div>
        <div class="w-1/2 h-1/2 bg-tertiary"></div>
        <div class="w-1/2 h-1/2 bg-primary"></div>
      </div>
      <div class="relative z-10 container mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center">
        <h1 class="font-display font-black text-6xl md:text-8xl xl:text-9xl uppercase tracking-tighter leading-none mb-6 text-primary drop-shadow-[4px_4px_0_#ffcc00]">
          Elevate <br/> Your Space
        </h1>
        <p class="font-body text-xl md:text-2xl max-w-2xl mb-10 text-on-surface-variant font-medium">
          Raw materials. Bold forms. Functional design. Discover a new era of home aesthetics.
        </p>
        <a routerLink="/products" class="bg-primary text-on-primary border-4 border-primary font-headline uppercase font-bold py-4 px-10 text-xl brutalist-shadow brutalist-shadow-hover inline-block">
          Shop Collection
        </a>
      </div>
    </section>

    <!-- Categories Grid -->
    <section class="container mx-auto px-6 py-16">
      <h2 class="font-headline font-black text-4xl uppercase mb-10 border-b-4 border-primary pb-4 inline-block">Categories</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Category 1: Decor -->
        <div 
          (click)="selectCategory('decor')"
          class="group cursor-pointer relative overflow-hidden border-4 border-primary h-80 flex items-center justify-center bg-surface-container brutalist-shadow transition-transform hover:-translate-y-1"
        >
          <div class="absolute inset-0 bg-primary-container transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          <h3 class="relative z-10 font-headline font-black text-3xl uppercase text-primary group-hover:text-primary transition-colors">Decor</h3>
        </div>

        <!-- Category 2: Bedding -->
        <div 
          (click)="selectCategory('bedding')"
          class="group cursor-pointer relative overflow-hidden border-4 border-primary h-80 flex items-center justify-center bg-surface-container brutalist-shadow transition-transform hover:-translate-y-1"
        >
          <div class="absolute inset-0 bg-tertiary transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          <h3 class="relative z-10 font-headline font-black text-3xl uppercase text-primary group-hover:text-on-primary transition-colors">Bedding</h3>
        </div>

        <!-- Category 3: Lighting -->
        <div 
          (click)="selectCategory('lighting')"
          class="group cursor-pointer relative overflow-hidden border-4 border-primary h-80 flex items-center justify-center bg-surface-container brutalist-shadow transition-transform hover:-translate-y-1"
        >
          <div class="absolute inset-0 bg-secondary transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          <h3 class="relative z-10 font-headline font-black text-3xl uppercase text-primary group-hover:text-on-primary transition-colors">Lighting</h3>
        </div>

        <!-- Category 4: Dining -->
        <div 
          (click)="selectCategory('dining')"
          class="group cursor-pointer relative overflow-hidden border-4 border-primary h-80 flex items-center justify-center bg-surface-container brutalist-shadow transition-transform hover:-translate-y-1"
        >
          <div class="absolute inset-0 bg-primary transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
          <h3 class="relative z-10 font-headline font-black text-3xl uppercase text-primary group-hover:text-on-primary transition-colors">Dining</h3>
        </div>
      </div>
    </section>

    <!-- Featured Products (Asymmetric Layout) -->
    @if (featuredProducts().length >= 3) {
      <section class="container mx-auto px-6 py-16">
        <h2 class="font-headline font-black text-4xl uppercase mb-10 border-b-4 border-primary pb-4 inline-block">Featured</h2>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Large Featured Product (Product 0) -->
          <div class="lg:col-span-8 border-4 border-primary bg-surface p-6 flex flex-col justify-between min-h-[500px] brutalist-shadow">
            <div class="w-full h-80 border-2 border-primary mb-6 bg-surface-container-high relative overflow-hidden group">
              <img 
                [src]="featuredProducts()[0].image" 
                [alt]="featuredProducts()[0].name"
                class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div class="absolute top-4 left-4 bg-primary-container text-primary font-headline font-bold uppercase px-3 py-1 border-2 border-primary">Featured</div>
            </div>
            <div>
              <h3 class="font-headline font-black text-3xl uppercase mb-2">
                <a [routerLink]="['/products', featuredProducts()[0]._id]" class="hover:text-secondary transition-colors">
                  {{ featuredProducts()[0].name }}
                </a>
              </h3>
              <p class="font-body text-on-surface-variant mb-6">{{ featuredProducts()[0].description }}</p>
              <div class="flex justify-between items-center border-t-4 border-primary pt-4">
                <span class="font-headline font-bold text-2xl">\${{ featuredProducts()[0].price }}</span>
                <button 
                  (click)="addToCart(featuredProducts()[0])" 
                  class="bg-primary text-on-primary border-4 border-primary font-headline uppercase font-bold py-2 px-6 transition-all hover:bg-secondary hover:text-primary active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>

          <!-- Smaller Featured Products (Product 1 & 2) -->
          <div class="lg:col-span-4 flex flex-col gap-8">
            <!-- Product 1 -->
            <div class="border-4 border-primary bg-surface p-4 flex flex-col justify-between flex-grow brutalist-shadow">
              <div class="w-full h-44 border-2 border-primary mb-4 bg-surface-container-high relative overflow-hidden group">
                <img 
                  [src]="featuredProducts()[1].image" 
                  [alt]="featuredProducts()[1].name"
                  class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div>
                <h3 class="font-headline font-black text-xl uppercase mb-1">
                  <a [routerLink]="['/products', featuredProducts()[1]._id]" class="hover:text-secondary transition-colors">
                    {{ featuredProducts()[1].name }}
                  </a>
                </h3>
                <div class="flex justify-between items-center mt-4">
                  <span class="font-headline font-bold text-lg">\${{ featuredProducts()[1].price }}</span>
                  <button 
                    (click)="addToCart(featuredProducts()[1])" 
                    class="bg-primary text-on-primary border-4 border-primary font-headline uppercase font-bold py-1 px-4 transition-all hover:bg-tertiary hover:text-on-primary"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <!-- Product 2 -->
            <div class="border-4 border-primary bg-surface p-4 flex flex-col justify-between flex-grow brutalist-shadow">
              <div class="w-full h-44 border-2 border-primary mb-4 bg-surface-container-high relative overflow-hidden group">
                <img 
                  [src]="featuredProducts()[2].image" 
                  [alt]="featuredProducts()[2].name"
                  class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div>
                <h3 class="font-headline font-black text-xl uppercase mb-1">
                  <a [routerLink]="['/products', featuredProducts()[2]._id]" class="hover:text-secondary transition-colors">
                    {{ featuredProducts()[2].name }}
                  </a>
                </h3>
                <div class="flex justify-between items-center mt-4">
                  <span class="font-headline font-bold text-lg">\${{ featuredProducts()[2].price }}</span>
                  <button 
                    (click)="addToCart(featuredProducts()[2])" 
                    class="bg-primary text-on-primary border-4 border-primary font-headline uppercase font-bold py-1 px-4 transition-all hover:bg-primary-container hover:text-primary"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    }
  `
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
    this.productService.getProducts('', '', 1, 3).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.featuredProducts.set(res.data.items);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
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

    this.cartService.addItem(product._id!, 1).subscribe({
      next: () => {
        this.toastService.showSuccess(`${product.name} added to cart!`);
      }
    });
  }
}
