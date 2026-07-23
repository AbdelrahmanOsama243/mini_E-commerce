import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order } from '../../../models/order.model';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <app-loading-spinner [visible]="loading()"></app-loading-spinner>
    
    <main class="flex-grow container mx-auto px-6 py-12 max-w-5xl">
      <div class="flex justify-between items-end border-b-4 border-primary pb-4 mb-8">
        <h1 class="text-4xl md:text-5xl font-headline font-black uppercase tracking-tighter">
          {{ isAdmin() ? 'All Orders (Admin)' : 'Order History' }}
        </h1>
        <span class="font-headline font-bold text-lg hidden sm:block">
          {{ orders().length }} Orders
        </span>
      </div>

      <!-- Empty Orders State -->
      @if (!loading() && orders().length === 0) {
        <div class="bg-surface-container brutalist-border p-12 text-center brutalist-shadow">
          <span class="material-symbols-outlined text-6xl text-primary/45 mb-4 font-bold">receipt_long</span>
          <h3 class="font-headline font-black text-2xl uppercase mb-2">No orders found</h3>
          <p class="font-body text-on-surface-variant max-w-md mx-auto mb-6">
            @if (isAdmin()) {
              No orders have been placed on the system yet.
            } @else {
              You haven't placed any orders yet. Visit our shop and pick a design.
            }
          </p>
          @if (!isAdmin()) {
            <a routerLink="/products" class="px-8 py-3 bg-primary text-on-primary font-headline font-black uppercase brutalist-shadow brutalist-shadow-hover inline-block">
              Shop Now
            </a>
          }
        </div>
      }

      <!-- Orders List -->
      @if (orders().length > 0) {
        <div class="flex flex-col gap-6">
          @for (order of orders(); track order._id) {
            <article class="bg-surface brutalist-border p-6 brutalist-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-3">
                  <span class="font-headline font-black text-lg">Order #{{ order._id?.slice(-8) }}</span>
                  <span 
                    class="font-headline font-bold text-xs uppercase px-3 py-1 border-2 border-primary"
                    [ngClass]="{
                      'bg-primary-container text-primary': order.status === 'pending',
                      'bg-tertiary-container text-primary': order.status === 'processing',
                      'bg-tertiary text-on-tertiary': order.status === 'shipped',
                      'bg-surface-dim text-primary': order.status === 'delivered'
                    }"
                  >
                    {{ order.status }}
                  </span>
                </div>
                
                <p class="font-body text-xs text-on-surface-variant">
                  Placed on: {{ order.createdAt | date: 'mediumDate' }}
                  @if (isAdmin() && order.userId) {
                    | Customer: {{ getCustomerName(order.userId) }}
                  }
                </p>
                <p class="font-body text-sm font-semibold max-w-md text-on-surface-variant line-clamp-1">
                  Ship to: {{ order.shippingAddress }}
                </p>
              </div>

              <!-- Price & Actions -->
              <div class="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto border-t-2 md:border-t-0 border-primary/20 pt-4 md:pt-0">
                <div class="flex flex-col md:items-end">
                  <span class="font-body text-xs text-on-surface-variant uppercase font-bold">Total Amount</span>
                  <span class="font-headline font-black text-2xl">\${{ order.totalPrice }}</span>
                </div>
                <a 
                  [routerLink]="['/orders', order._id]"
                  class="py-3 px-6 bg-primary text-on-primary font-headline uppercase font-bold text-sm brutalist-button brutalist-shadow-sm brutalist-shadow-hover-sm inline-block"
                >
                  Details
                </a>
              </div>
            </article>
          }
        </div>
      }
    </main>
  `
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
        if (res && res.success) {
          // Sort orders: newest first
          const sorted = res.data.sort((a, b) => {
            return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
          });
          this.orders.set(sorted);
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

  getCustomerName(user: any): string {
    if (typeof user === 'object' && user) {
      return user.name || user.email || 'Unknown';
    }
    return 'Customer';
  }
}
