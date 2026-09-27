import { Component, OnInit, inject, signal } from '@angular/core';
import { AnalyticsService } from '../../../core/Services/analytics-service';
import { UserOrderStats, ChartDataPoint } from '../../../Models/ianalytics';
import { Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-user-dashboard',
  standalone: false,
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css'
})
export class UserDashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  public stats = signal<UserOrderStats | null>(null);
  public statusChartData = signal<ChartDataPoint[]>([]);
  public spendingChartData = signal<{ name: string; series: ChartDataPoint[] }[]>([]);
  public loading = signal(true);
  public errorMessage = signal<string | null>(null);

  // ngx-charts options
  public colorScheme: Color = {
    name: 'customBrutalist',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#10B981', '#F59E0B', '#3B82F6', '#6366F1', '#8B5CF6', '#EF4444', '#6B7280']
  };

  public spendingColorScheme: Color = {
    name: 'spendingBrutalist',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#111827']
  };

  ngOnInit() {
    this.loadUserAnalytics();
  }

  loadUserAnalytics() {
    this.loading.set(true);
    this.errorMessage.set(null);

    // 1. Load Stats
    this.analyticsService.getUserStats().subscribe({
      next: (res) => {
        if (res?.success) {
          this.stats.set(res.data);
        }
      },
      error: (err) => {
        console.error('Failed to load user stats:', err);
      }
    });

    // 2. Load Status Breakdown Chart Data
    this.analyticsService.getUserOrdersByStatus().subscribe({
      next: (res) => {
        if (res?.success && Array.isArray(res.data)) {
          // Format status labels for readability
          const formatted = res.data.map(item => ({
            name: this.formatStatusLabel(item.name),
            value: item.value
          }));
          this.statusChartData.set(formatted);
        }
      },
      error: (err) => {
        console.error('Failed to load status breakdown:', err);
      }
    });

    // 3. Load Spending Timeline
    this.analyticsService.getUserSpendingTimeline().subscribe({
      next: (res) => {
        if (res?.success && Array.isArray(res.data)) {
          this.spendingChartData.set([
            {
              name: 'Monthly Spending',
              series: res.data
            }
          ]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load spending timeline:', err);
        this.loading.set(false);
      }
    });
  }

  formatStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid': return 'Paid (Success)';
      case 'pending': return 'Pending Payment';
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'refunded': return 'Refunded';
      case 'partially_refunded': return 'Partial Refund';
      case 'payment_failed':
      case 'failed': return 'Failed';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Other';
    }
  }
}
