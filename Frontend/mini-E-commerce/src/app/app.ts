import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/Services/auth-service';
import { ToastService } from './shared/toast/toast.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('mini-E-commerce');
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  public showNavbar = true;
  public isOnline = signal(true);

  private onlineHandler?: () => void;
  private offlineHandler?: () => void;

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed() // Automatically unsubscribes when Component is destroyed
      )
      .subscribe((event: any) => {
        // Hide the Navbar if the URL is login or register
        this.showNavbar = !(event.url.includes('/login') || event.url.includes('/register'));
      });
  }

  ngOnInit(): void {
    // Initialize online status
    this.isOnline.set(navigator.onLine);

    // Listen for online/offline events
    this.onlineHandler = () => {
      this.isOnline.set(true);
      this.toastService.showSuccess('Back Online - Your connection has been restored.');
    };
    this.offlineHandler = () => {
      this.isOnline.set(false);
      this.toastService.showError('No Internet - You are offline. Some features may not work.');
    };

    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  ngOnDestroy(): void {
    if (this.onlineHandler) window.removeEventListener('online', this.onlineHandler);
    if (this.offlineHandler) window.removeEventListener('offline', this.offlineHandler);
  }
}
