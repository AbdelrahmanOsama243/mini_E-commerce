import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AnalyticsService } from '../../../core/Services/analytics-service';
import { ProductService } from '../../../core/Services/ProductService';
import { ToastService } from '../../../shared/toast/toast.service';
import {
  AdminOverview,
  AdminProductRanking,
  LowStockProduct,
  TopCustomer,
  ChartDataPoint
} from '../../../Models/ianalytics';
import { Product, CreateProductPayload, UpdateProductPayload } from '../../../Models/iproduct';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private productService = inject(ProductService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);

  // Analytics Signals
  public overview = signal<AdminOverview | null>(null);
  public topProducts = signal<AdminProductRanking[]>([]);
  public topProductsChart = signal<ChartDataPoint[]>([]);
  public leastProducts = signal<AdminProductRanking[]>([]);
  public lowStockProducts = signal<LowStockProduct[]>([]);
  public revenueChartData = signal<{ name: string; series: ChartDataPoint[] }[]>([]);
  public paymentMethodChart = signal<ChartDataPoint[]>([]);
  public topCustomers = signal<TopCustomer[]>([]);

  // Product Hub & Modals Signals
  public allProducts = signal<Product[]>([]);
  public filteredProducts = signal<Product[]>([]);
  public productSearchQuery = signal<string>('');
  public selectedCategory = signal<string>('all');

  public loading = signal(true);
  public actionLoading = signal(false);
  public showLookerEmbed = signal(false);
  public lookerUrl: SafeResourceUrl | null = null;

  // Dialog State Signals
  public isCreateModalOpen = signal(false);
  public isEditModalOpen = signal(false);
  public isRestockModalOpen = signal(false);
  public isInventoryModalOpen = signal(false);
  public isDeleteModalOpen = signal(false);

  public editingProduct = signal<Product | null>(null);
  public restockingProduct = signal<{ id: string; name: string; currentStock: number; category?: string } | null>(null);
  public newStockValue = signal<number>(0);
  public deletingProductId = signal<string | null>(null);
  public deletingProductName = signal<string>('');

  // Product Form
  public productForm: FormGroup;
  public submitted = false;

  // Chart Schemes - Vibrantly styled for both light and dark
  public primaryBarScheme: Color = {
    name: 'primaryBrutalist',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
  };

  public revenueScheme: Color = {
    name: 'revenueBrutalist',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#10b981']
  };

  public paymentScheme: Color = {
    name: 'paymentBrutalist',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
  };

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['decor', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      image: [''],
      description: [''],
    });
  }

  ngOnInit() {
    this.initLookerUrl();
    this.loadAdminAnalytics();
    this.loadAllProducts();
  }

  get f() {
    return this.productForm.controls;
  }

  initLookerUrl() {
    const rawUrl = this.analyticsService.getLookerEmbedUrl();
    if (rawUrl) {
      this.lookerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
    }
  }

  toggleLooker() {
    this.showLookerEmbed.update(v => !v);
  }

  loadAdminAnalytics() {
    this.loading.set(true);

    // Use forkJoin to wait for ALL analytics API calls to complete
    // This ensures loading is set to false even if some calls fail
    forkJoin({
      overview: this.analyticsService.getAdminOverview(),
      topProducts: this.analyticsService.getAdminTopProducts(10),
      leastProducts: this.analyticsService.getAdminLeastProducts(10),
      lowStock: this.analyticsService.getAdminLowStock(10),
      revenue: this.analyticsService.getAdminRevenueTimeline(),
      paymentStats: this.analyticsService.getAdminPaymentStats(),
      topCustomers: this.analyticsService.getAdminTopCustomers(8),
    }).subscribe({
      next: (results) => {
        // 1. Overview
        if (results.overview?.success) {
          this.overview.set(results.overview.data);
        }

        // 2. Top Selling Products
        if (results.topProducts?.success && Array.isArray(results.topProducts.data)) {
          this.topProducts.set(results.topProducts.data);
          this.topProductsChart.set(
            results.topProducts.data.slice(0, 6).map((p: any) => ({
              name: p.name.length > 18 ? p.name.substring(0, 16) + '..' : p.name,
              value: p.totalSold
            }))
          );
        }

        // 3. Least Selling Products
        if (results.leastProducts?.success && Array.isArray(results.leastProducts.data)) {
          this.leastProducts.set(results.leastProducts.data);
        }

        // 4. Low Stock Alerts
        if (results.lowStock?.success && Array.isArray(results.lowStock.data)) {
          this.lowStockProducts.set(results.lowStock.data);
        }

        // 5. Revenue Timeline
        if (results.revenue?.success && Array.isArray(results.revenue.data)) {
          this.revenueChartData.set([
            {
              name: 'My Store Revenue',
              series: results.revenue.data
            }
          ]);
        }

        // 6. Payment Stats
        if (results.paymentStats?.success && Array.isArray(results.paymentStats.data)) {
          this.paymentMethodChart.set(results.paymentStats.data);
        }

        // 7. Top Customers
        if (results.topCustomers?.success && Array.isArray(results.topCustomers.data)) {
          this.topCustomers.set(results.topCustomers.data);
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load admin analytics:', err);
        this.loading.set(false);
      }
    });
  }

  loadAllProducts() {
    this.productService.getProducts({ page: 1, limit: 200 }).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
          this.allProducts.set(items);
          this.applyProductFilter();
        }
      },
      error: (err) => console.error('Error fetching all products:', err)
    });
  }

  applyProductFilter() {
    let prods = this.allProducts();
    const query = this.productSearchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();

    if (cat !== 'all') {
      prods = prods.filter(p => p.category?.toLowerCase() === cat.toLowerCase());
    }

    if (query) {
      prods = prods.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }

    this.filteredProducts.set(prods);
  }

  onSearchChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.productSearchQuery.set(val);
    this.applyProductFilter();
  }

  onCategoryFilterChange(cat: string) {
    this.selectedCategory.set(cat);
    this.applyProductFilter();
  }

  // ==========================================
  // POPUP DIALOG SERVICES
  // ==========================================

  // --- 1. Quick Restock Popup Dialog ---
  public restockAmount = signal<number>(10);

  openRestockModal(item?: { _id?: string; productId?: string; id?: string; name?: string; stock?: number; currentStock?: number; category?: string }) {
    if (item && (item._id || item.productId || item.id)) {
      const prodId = item._id || item.productId || item.id || '';
      const foundInAll = this.allProducts().find(p => p._id === prodId);
      const name = item.name || foundInAll?.name || 'Selected Product';
      const currentStock = item.stock ?? item.currentStock ?? foundInAll?.stock ?? 0;
      const category = item.category || foundInAll?.category || 'decor';

      this.restockingProduct.set({
        id: prodId,
        name,
        currentStock,
        category
      });
    } else if (this.allProducts().length > 0) {
      // Default to first product if none selected
      const first = this.allProducts()[0];
      this.restockingProduct.set({
        id: first._id,
        name: first.name,
        currentStock: first.stock,
        category: first.category
      });
    }

    this.restockAmount.set(10);
    this.isRestockModalOpen.set(true);
  }

  onSelectRestockProduct(prodId: string) {
    const found = this.allProducts().find(p => p._id === prodId);
    if (found) {
      this.restockingProduct.set({
        id: found._id,
        name: found.name,
        currentStock: found.stock,
        category: found.category
      });
    }
  }

  closeRestockModal() {
    this.isRestockModalOpen.set(false);
    this.restockingProduct.set(null);
  }

  setRestockAmount(amount: number) {
    this.restockAmount.set(Math.max(1, amount));
  }

  addRestockAmount(delta: number) {
    this.restockAmount.set(Math.max(1, this.restockAmount() + delta));
  }

  saveRestock() {
    const target = this.restockingProduct();
    if (!target || !target.id) {
      this.toastService.showError('Please select a valid product to restock.');
      return;
    }

    const qtyToAdd = this.restockAmount();
    if (!qtyToAdd || qtyToAdd <= 0) {
      this.toastService.showError('Please specify a positive restock quantity.');
      return;
    }

    const finalStock = target.currentStock + qtyToAdd;

    this.actionLoading.set(true);
    this.productService.updateProduct(target.id, { stock: finalStock }).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.closeRestockModal();
        this.toastService.showSuccess(`Added +${qtyToAdd} units to "${target.name}". Total stock is now ${finalStock}!`);
        this.loadAdminAnalytics();
        this.loadAllProducts();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.toastService.showError(err?.error?.message || 'Failed to update stock.');
      }
    });
  }

  // --- 2. Create Product Popup Dialog ---
  openCreateModal() {
    this.editingProduct.set(null);
    this.submitted = false;
    this.productForm.reset({
      name: '',
      category: 'decor',
      price: 0,
      stock: 10,
      image: '',
      description: '',
    });
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal() {
    this.isCreateModalOpen.set(false);
  }

  // --- 3. Edit Product Popup Dialog ---
  openEditModal(product: Product | { _id?: string; productId?: string; name: string; category?: string; price: number; stock: number; image?: string; description?: string }) {
    const prodId = product._id || (product as any).productId;
    const fullProd = this.allProducts().find(p => p._id === prodId) || (product as Product);

    this.editingProduct.set(fullProd);
    this.submitted = false;
    this.productForm.reset({
      name: fullProd.name,
      category: fullProd.category || 'decor',
      price: fullProd.price,
      stock: fullProd.stock,
      image: fullProd.image || '',
      description: fullProd.description || '',
    });
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    this.editingProduct.set(null);
  }

  // --- Save Product (Create or Edit) ---
  onProductSubmit() {
    this.submitted = true;
    if (this.productForm.invalid) {
      return;
    }

    this.actionLoading.set(true);
    const formData = this.productForm.value as CreateProductPayload;
    const editing = this.editingProduct();

    if (editing && editing._id) {
      // Edit
      this.productService.updateProduct(editing._id, formData as UpdateProductPayload).subscribe({
        next: () => {
          this.actionLoading.set(false);
          this.closeEditModal();
          this.toastService.showSuccess(`Product "${formData.name}" updated successfully!`);
          this.loadAdminAnalytics();
          this.loadAllProducts();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.toastService.showError(err?.error?.message || 'Failed to update product.');
        }
      });
    } else {
      // Create
      this.productService.createProduct(formData).subscribe({
        next: () => {
          this.actionLoading.set(false);
          this.closeCreateModal();
          this.toastService.showSuccess(`Product "${formData.name}" created successfully!`);
          this.loadAdminAnalytics();
          this.loadAllProducts();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.toastService.showError(err?.error?.message || 'Failed to create product.');
        }
      });
    }
  }

  // --- 4. Inventory Hub Popup Dialog ---
  openInventoryModal() {
    this.loadAllProducts();
    this.isInventoryModalOpen.set(true);
  }

  closeInventoryModal() {
    this.isInventoryModalOpen.set(false);
  }

  // --- 5. Delete Confirmation Dialog ---
  openDeleteModal(id: string, name: string) {
    this.deletingProductId.set(id);
    this.deletingProductName.set(name);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.deletingProductId.set(null);
    this.deletingProductName.set('');
  }

  confirmDelete() {
    const id = this.deletingProductId();
    if (!id) return;

    this.actionLoading.set(true);
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.closeDeleteModal();
        this.toastService.showSuccess('Product removed successfully.');
        this.loadAdminAnalytics();
        this.loadAllProducts();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.toastService.showError(err?.error?.message || 'Failed to delete product.');
      }
    });
  }
}

