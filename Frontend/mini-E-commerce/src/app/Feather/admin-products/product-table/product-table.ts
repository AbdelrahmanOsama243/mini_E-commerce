import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../../core/Services/ProductService';
import { ToastService } from '../../../shared/toast/toast.service';
import { Product, CreateProductPayload, UpdateProductPayload } from '../../../Models/iproduct';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-admin-products',
  standalone: false,
  templateUrl: './product-table.html',
  styleUrl: './product-table.css',
})
export class AdminProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  public products = signal<Product[]>([]);
  public loading = signal(false);

  public isModalOpen = signal(false);
  public editingProduct = signal<Product | null>(null);
  public productForm: FormGroup;
  public submitted = false;

  constructor() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      category: ['decor', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      image: [''],
      description: [''],
    });
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);
    this.productService.getProducts({ page: 1, limit: 100 }).subscribe({
      next: (res: any) => {
        try {
          if (res && res.success) {
            const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
            this.products.set(items);
          }
        } catch (e) {
          console.error('Error processing products', e);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching products', err);
        this.loading.set(false);
      },
    });
  }

  get f() {
    return this.productForm.controls;
  }

  openCreateModal() {
    this.editingProduct.set(null);
    this.submitted = false;
    this.productForm.reset({
      name: '',
      category: 'decor',
      price: 0,
      stock: 0,
      image: '',
      description: '',
    });
    this.isModalOpen.set(true);
  }

  openEditModal(product: Product) {
    this.editingProduct.set(product);
    this.submitted = false;
    this.productForm.reset({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      image: product.image || '',
      description: product.description || '',
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  onSubmit() {
    this.submitted = true;

    if (this.productForm.invalid) {
      return;
    }

    this.loading.set(true);
    const formData = this.productForm.value as CreateProductPayload;
    const prodId = this.editingProduct()?._id;

    if (prodId) {
      // Edit mode
      this.productService.updateProduct(prodId, formData as UpdateProductPayload).subscribe({
        next: () => {
          this.loading.set(false);
          this.isModalOpen.set(false);
          this.toastService.showSuccess('Product updated successfully!');
          this.loadProducts();
        },
        error: () => this.loading.set(false),
      });
    } else {
      // Create mode
      this.productService.createProduct(formData).subscribe({
        next: () => {
          this.loading.set(false);
          this.isModalOpen.set(false);
          this.toastService.showSuccess('Product created successfully!');
          this.loadProducts();
        },
        error: () => this.loading.set(false),
      });
    }
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.loading.set(true);
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.loading.set(false);
          this.toastService.showSuccess('Product deleted successfully.');
          this.loadProducts();
        },
        error: () => this.loading.set(false),
      });
    }
  }
}
