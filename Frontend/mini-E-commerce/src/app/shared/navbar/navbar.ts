import { Component, inject, signal, HostListener, effect } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/Services/auth-service';
import { CartService } from '../../core/Services/cart-service';
import { ToastService } from '../../shared/toast/toast.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  public cartCount$ = this.cartService.cartCount$;
  public mobileMenuOpen = signal(false);
  public categoryMenuOpen = signal(false);
  public mobileCategoryOpen = signal(false);
  public isDarkMode = signal(false);

  // Reactive signals for auth state — automatically update on login/logout
  private currentUser$ = this.authService.currentUser$;
  public isLoggedIn = toSignal(
    this.currentUser$.pipe(map((user) => user !== null)),
    { initialValue: this.authService.isLoggedIn() }
  );
  public isAdmin = toSignal(
    this.currentUser$.pipe(map((user) => user?.role === 'admin')),
    { initialValue: this.authService.isAdmin() }
  );
  public currentUser = toSignal(this.currentUser$, { initialValue: this.authService.getUser() });
  public isVerified = toSignal(
    this.currentUser$.pipe(map((user) => user?.isVerified === true)),
    { initialValue: this.authService.isVerified() }
  );

  // User dropdown state
  public userDropdownOpen = signal(false);

  constructor() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.isDarkMode.set(true);
      document.documentElement.classList.add('dark');
    } else {
      this.isDarkMode.set(false);
      document.documentElement.classList.remove('dark');
    }
  }

  toggleDarkMode() {
    this.isDarkMode.set(!this.isDarkMode());
    if (this.isDarkMode()) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  // ── User Dropdown Handlers ────────────────────────────────────────────────

  toggleUserDropdown() {
    this.userDropdownOpen.update(v => !v);
  }

  resendVerification() {
    const email = this.currentUser()?.email;
    if (!email) return;
    this.authService.resendVerification({ name: 'User', email, password: 'placeholder' }).subscribe({
      next: () => {
        this.toggleUserDropdown();
        this.toastService.showSuccess('Verification Sent - If this email is registered, a verification link has been sent.');
      },
      error: () => {
        this.toggleUserDropdown();
        this.toastService.showSuccess('Verification Sent - If this email is registered, a verification link has been sent.');
      },
    });
  }

  navigateToForgotPassword() {
    this.toggleUserDropdown();
    this.router.navigate(['/forgot-password']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (this.categoryMenuOpen() && !target.closest('.category-dropdown')) {
      this.categoryMenuOpen.set(false);
    }
    if (this.userDropdownOpen() && !target.closest('.user-dropdown-container')) {
      this.userDropdownOpen.set(false);
    }
  }

  search(val: string) {
    if (val && val.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: val.trim() } });
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // If backend fails, force local logout anyway
        this.authService.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }
}
