import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../models/product.model';
import { ProductCardComponent } from '../../../shared/product-card/product-card';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, LoadingSpinnerComponent, FormsModule],
  template: `
    <app-loading-spinner [visible]="loading()"></app-loading-spinner>
    
    <main class="flex-grow flex flex-col md:flex-row w-full max-w-7xl mx-auto px-6 py-12 gap-8">
      <!-- Left Sidebar Filters -->
      <aside class="w-full md:w-64 flex-shrink-0 flex flex-col gap-6">
        <!-- Categories Filter -->
        <div class="bg-surface-container brutalist-border p-6 brutalist-shadow">
          <h3 class="font-headline font-bold text-xl uppercase mb-4 border-b-2 border-primary pb-2">Categories</h3>
          <ul class="space-y-3 font-headline font-semibold">
            @for (cat of categories; track cat.id) {
              <li>
                <label class="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    [checked]="selectedCategory() === cat.id"
                    (change)="toggleCategory(cat.id)"
                    class="form-checkbox h-5 w-5 text-primary border-2 border-primary rounded-none focus:ring-0 focus:ring-offset-0 bg-background checked:bg-primary cursor-pointer"
                  />
                  <span class="group-hover:text-secondary transition-colors uppercase">{{ cat.name }}</span>
                </label>
              </li>
            }
          </ul>
        </div>

        <!-- Price Range Filter -->
        <div class="bg-surface-container brutalist-border p-6 brutalist-shadow">
          <h3 class="font-headline font-bold text-xl uppercase mb-4 border-b-2 border-primary pb-2">Max Price</h3>
          <div class="space-y-4">
            <input 
              type="range" 
              min="0" 
              max="1000" 
              [(ngModel)]="priceLimit"
              (change)="applyPriceFilter()"
              class="w-full h-2 bg-primary rounded-none appearance-none cursor-pointer accent-secondary"
            />
            <div class="flex justify-between font-headline font-bold text-sm">
              <span>$0</span>
              <span class="text-secondary font-black">\${{ priceLimit() }}</span>
              <span>$1000+</span>
            </div>
          </div>
        </div>

        <!-- Reset Button -->
        <button 
          (click)="resetFilters()" 
          class="w-full py-4 bg-primary text-on-primary text-xl brutalist-button brutalist-shadow brutalist-shadow-hover"
        >
          Reset Filters
        </button>
      </aside>

      <!-- Main Product Grid -->
      <section class="flex-grow flex flex-col gap-6">
        <div class="flex justify-between items-end border-b-4 border-primary pb-4">
          <h1 class="text-4xl md:text-6xl font-headline font-black uppercase tracking-tighter">
            {{ selectedCategory() ? selectedCategory() : 'Shop All' }}
          </h1>
          <span class="font-headline font-bold text-lg hidden sm:block">
            Showing {{ filteredProducts().length }} Results
          </span>
        </div>

        <!-- Search term alert if any -->
        @if (searchTerm()) {
          <div class="bg-primary-container brutalist-border p-4 font-headline font-bold uppercase flex justify-between items-center">
            <span>Search results for: "{{ searchTerm() }}"</span>
            <button (click)="clearSearch()" class="hover:text-secondary flex items-center justify-center p-1">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        }

        <!-- Empty State -->
        @if (!loading() && filteredProducts().length === 0) {
          <div class="bg-surface-variant brutalist-border p-12 text-center brutalist-shadow">
            <span class="material-symbols-outlined text-6xl text-primary/45 mb-4">search_off</span>
            <h3 class="font-headline font-black text-2xl uppercase mb-2">No Products Found</h3>
            <p class="font-body text-on-surface-variant max-w-md mx-auto mb-6">
              We couldn't find any products matching your filters. Try selecting another category or resetting filters.
            </p>
            <button (click)="resetFilters()" class="px-6 py-2 bg-primary text-on-primary font-headline font-bold uppercase hover:bg-secondary hover:text-primary transition-colors">
              Reset Filters
            </button>
          </div>
        }

        <!-- Product Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (prod of filteredProducts(); track prod._id) {
            <app-product-card [product]="prod"></app-product-card>
          }
        </div>

        <!-- Infinite Scroll Sentinel -->
        @if (hasMorePages() && filteredProducts().length > 0) {
          <div #scrollSentinel class="mt-12 flex justify-center py-8">
            <span class="material-symbols-outlined text-4xl text-primary/40 animate-spin">progress_activity</span>
          </div>
        }
      </section>
    </main>
  `
})
export class ProductListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollSentinel') scrollSentinel!: ElementRef;
  private observer: IntersectionObserver | null = null;
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);

  public categories = [
    { id: 'decor', name: 'Decor' },
    { id: 'bedding', name: 'Bedding' },
    { id: 'lighting', name: 'Lighting' },
    { id: 'dining', name: 'Dining' }
  ];
  

  public allProducts = signal<Product[]>([]);
  public filteredProducts = signal<Product[]>([]);
  
  public selectedCategory = signal<string>('');
  public searchTerm = signal<string>('');
  public priceLimit = signal<number>(1000);
  
  public loading = signal(false);
  public page = 1;
  public hasMorePages = signal(false);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.selectedCategory.set(params['category'] || '');
      this.searchTerm.set(params['search'] || '');
      this.page = 1;
      this.allProducts.set([]);
      this.fetchProducts();
    });
  }

  ngAfterViewInit() {
    this.setupObserver();
  }

  ngOnDestroy() {
    this.destroyObserver();
  }

  private setupObserver() {
    // Delay to let the template render the sentinel
    setTimeout(() => {
      this.destroyObserver();
      if (!this.scrollSentinel?.nativeElement) return;

      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && this.hasMorePages() && !this.loading()) {
            this.loadMore();
          }
        },
        { threshold: 0.1 }
      );
      this.observer.observe(this.scrollSentinel.nativeElement);
    }, 100);
  }

  private destroyObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  fetchProducts() {
    this.loading.set(true);
    this.productService.getProducts(
      this.searchTerm(),
      this.selectedCategory(),
      this.page,
      10
    ).subscribe({
      next: (res) => {
        if (res && res.success) {
          const items = res.data.items;
          const current = this.page === 1 ? [] : this.allProducts();
          this.allProducts.set([...current, ...items]);
          this.hasMorePages.set(this.allProducts().length < res.data.total);
          this.applyLocalFilters();
        }
        this.loading.set(false);
        // Re-setup observer after new content renders
        this.setupObserver();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  applyLocalFilters() {
    let result = this.allProducts();
    
    // Local filter by price limit
    result = result.filter(p => p.price <= this.priceLimit());

    this.filteredProducts.set(result);
  }

  toggleCategory(categoryId: string) {
    if (this.selectedCategory() === categoryId) {
      this.selectedCategory.set('');
    } else {
      this.selectedCategory.set(categoryId);
    }
    this.page = 1;
    this.allProducts.set([]);
    this.fetchProducts();
  }

  applyPriceFilter() {
    this.applyLocalFilters();
  }

  loadMore() {
    this.page++;
    this.fetchProducts();
  }

  resetFilters() {
    this.selectedCategory.set('');
    this.searchTerm.set('');
    this.priceLimit.set(1000);
    this.page = 1;
    this.allProducts.set([]);
    this.fetchProducts();
  }

  clearSearch() {
    this.searchTerm.set('');
    this.page = 1;
    this.allProducts.set([]);
    this.fetchProducts();
  }
}
