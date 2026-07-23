import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { OrderService } from '../../../core/Services/order-service';
import { AuthService } from '../../../core/Services/auth-service';
import { ToastService } from '../../../shared/toast/toast.service';
import { Order, OrderStatus } from '../../../Models/iorder';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-detail',
  standalone: false,
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class OrderDetailComponent implements OnInit {
  @Input() id!: string; // Route parameter bound automatically

  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  public order = signal<Order | null>(null);
  public loading = signal(false);
  public selectedStatus: string = 'pending';

  ngOnInit() {
    if (this.id) {
      this.loadOrder();
    }
  }

  loadOrder() {
    this.loading.set(true);
    this.orderService.getOrderById(this.id).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.order.set(res.data);
          this.selectedStatus = res.data.status;
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getCustomerEmail(user: any): string {
    if (typeof user === 'object' && user) {
      return user.email || user.name || 'Unknown';
    }
    return user || 'Unknown';
  }

  updateStatus() {
    if (!this.id) return;
    this.loading.set(true);
    this.orderService.updateOrderStatus(this.id, { status: this.selectedStatus as OrderStatus }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastService.showSuccess('Order status updated successfully.');
        this.loadOrder();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
