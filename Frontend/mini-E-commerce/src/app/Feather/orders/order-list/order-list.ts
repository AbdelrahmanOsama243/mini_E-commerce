import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/Services/order-service';
import { AuthService } from '../../../core/Services/auth-service';
import { Order } from '../../../Models/iorder';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-order-list',
  standalone: false,
  templateUrl: './order-list.html',
  styleUrl: './order-list.css'
})
export class OrderHistoryComponent implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);

  public orders = signal<Order[]>([]);
  public loading = signal(false);

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    const adminMode = this.isAdmin();
    this.orderService.getOrders(adminMode).subscribe({
      next: (res) => {
        if (res && res.success && Array.isArray(res.data)) {
          // Sort orders: newest first
          const sorted = res.data.sort((a:any, b:any) => {
            return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
          });
          this.orders.set(sorted);
        } else if (res && res.success && res.data && Array.isArray((res.data as any).items)) {
           // Fallback in case the backend wraps it in { items: ... }
           const sorted = (res.data as any).items.sort((a:any, b:any) => {
            return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
          });
          this.orders.set(sorted);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching orders:', err);
        this.loading.set(false);
      }
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getCustomerName(user: any): string {
    if (typeof user === 'object' && user) {
      return user.name || user.email || 'Unknown';
    }
    return 'Customer';
  }
}
