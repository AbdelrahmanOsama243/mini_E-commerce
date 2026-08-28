import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { OrderService } from '../../../core/Services/order-service';
import { AuthService } from '../../../core/Services/auth-service';
import { PaymentService } from '../../../core/Services/payment.service';
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
  private paymentService = inject(PaymentService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  public order = signal<Order | null>(null);
  public loading = signal(false);
  public selectedStatus: string = 'pending';

  // Refund Modal State
  public refundModalOpen = signal(false);
  public refundAmount: number | null = null;
  public refundProcessing = signal(false);

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
          this.refundAmount = res.data.totalPrice;
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
      error: (err) => {
        this.loading.set(false);
        this.toastService.showError(err?.error?.message || 'Failed to update order status.');
      }
    });
  }

  openRefundModal() {
    const currentOrder = this.order();
    if (currentOrder) {
      this.refundAmount = currentOrder.totalPrice;
    }
    this.refundModalOpen.set(true);
  }

  closeRefundModal() {
    this.refundModalOpen.set(false);
  }

  submitRefund() {
    const currentOrder = this.order();
    if (!currentOrder) return;

    if (!this.refundAmount || this.refundAmount <= 0) {
      this.toastService.showError('Please enter a valid refund amount.');
      return;
    }

    if (this.refundAmount > currentOrder.totalPrice) {
      this.toastService.showError('Refund amount cannot exceed total order price.');
      return;
    }

    this.refundProcessing.set(true);
    const amountCents = Math.round(this.refundAmount * 100);

    this.paymentService.refundPayment({
      orderId: currentOrder._id,
      amountCents: amountCents < Math.round(currentOrder.totalPrice * 100) ? amountCents : undefined
    }).subscribe({
      next: (res) => {
        this.refundProcessing.set(false);
        this.refundModalOpen.set(false);
        this.toastService.showSuccess('Refund processed successfully.');
        this.loadOrder();
      },
      error: (err) => {
        this.refundProcessing.set(false);
        this.toastService.showError(err?.error?.message || 'Failed to process refund.');
      }
    });
  }
}

