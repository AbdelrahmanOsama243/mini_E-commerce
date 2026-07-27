import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/Services/ProductService';
import { Product } from '../../../Models/iproduct';
import { ProductCardComponent } from '../../../shared/product-card/product-card';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
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
    { id: 'dining', name: 'Dining' },
    { id: 'furniture', name: 'Furniture' },
    { id: 'kitchen', name: 'Kitchen' },
    { id: 'storage', name: 'Storage' },
    { id: 'bath', name: 'Bath' },
    { id: 'textiles', name: 'Textiles' },
    { id: 'accessories', name: 'Accessories' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'electronics', name: 'Electronics' }
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
    this.productService.getProducts({
      search: this.searchTerm(),
      category: this.selectedCategory(),
      page: this.page,
      limit: 10
    }).subscribe({
      next: (res: any) => {
        try {
          if (res && res.success) {
            const dataObj = res.data || {};
            const items = Array.isArray(res.data) ? res.data : (Array.isArray(dataObj.items) ? dataObj.items : []);
            const current = this.page === 1 ? [] : this.allProducts();
            this.allProducts.set([...current, ...items]);
            
            const total = res.pagination?.total ?? dataObj.total ?? 0;
            this.hasMorePages.set(this.allProducts().length < total);
            this.applyLocalFilters();
          }
        } catch (e) {
          console.error("Error processing products response", e);
        }
        this.loading.set(false);
        // Re-setup observer after new content renders
        this.setupObserver();
      },
      error: (err) => {
        console.error("Error fetching products", err);
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
