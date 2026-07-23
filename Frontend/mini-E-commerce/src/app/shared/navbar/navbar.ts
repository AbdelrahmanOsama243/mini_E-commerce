import { Component, inject, signal, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/Services/auth-service';
import { CartService } from '../../core/Services/cart-service';
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

  public cartCount$ = this.cartService.cartCount$;
  public mobileMenuOpen = signal(false);
  public categoryMenuOpen = signal(false);
  public mobileCategoryOpen = signal(false);

  isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  isAdmin() {
    return this.authService.isAdmin();
  }

  currentUser() {
    return this.authService.getUser();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (this.categoryMenuOpen() && !target.closest('.category-dropdown')) {
      this.categoryMenuOpen.set(false);
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
