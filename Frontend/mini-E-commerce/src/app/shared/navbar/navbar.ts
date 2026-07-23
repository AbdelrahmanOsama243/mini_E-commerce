import { Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav
      class="bg-background text-primary font-headline uppercase font-black tracking-tighter w-full border-b-4 border-primary shadow-[6px_6px_0px_0px_#1a1a1a] flex justify-between items-center px-6 py-4 sticky top-0 z-50 transition-all"
    >
      <!-- Left Branding and Links -->
      <div class="flex items-center gap-8">
        <!-- Brand Logo -->
        <a
          routerLink="/"
          class="text-2xl font-headline font-black text-primary uppercase flex items-center gap-2"
        >
          <img
            alt="MiniStore Logo"
            class="h-10 w-10 object-contain border-2 border-primary brutalist-shadow-sm bg-white"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB244ezzR2F-awqvPSO2hNhJ-Xwi0oPhGvsImVivUpqxhqNuKAm9VvCm_nJgkwwIkmaMEQCQSomA4Wukw0Ys6S-RlNTcM9xF0barjn6XzsDrGKF_CX42vXrT0-Qmi0uu5KBEUovoVvVzb5kzsK8OCdjrHqe1dMmglrxau81bCtMp6zM3DbjSL8lHF6KFL3S1Tw9wXqr_zgaKKQ_A7e0wAl3Y9iume3L0B7B-fNkmkYt4x7ANowhEUR795H8heeOVCSKr8QUjz-gNFXb"
          />
          MiniStore
        </a>

        <!-- Navigation Links (Desktop) -->
        <div class="hidden md:flex gap-6 items-center">
          <a
            routerLink="/products"
            routerLinkActive="bg-primary text-on-primary"
            [routerLinkActiveOptions]="{ exact: true }"
            class="text-primary hover:bg-primary hover:text-on-primary transition-colors px-2 py-1"
            >Shop</a
          >

          <!-- Categories Dropdown -->
          <div class="relative category-dropdown">
            <button
              (click)="categoryMenuOpen.set(!categoryMenuOpen())"
              class="text-primary hover:bg-primary hover:text-on-primary transition-colors px-2 py-1 flex items-center gap-1"
            >
              Categories
              <span
                class="material-symbols-outlined text-base transition-transform"
                [class.rotate-180]="categoryMenuOpen()"
                >expand_more</span
              >
            </button>
            @if (categoryMenuOpen()) {
              <div
                class="absolute top-full left-0 mt-1 bg-background border-4 border-primary shadow-[6px_6px_0px_0px_#1a1a1a] min-w-[180px] z-50 flex flex-col"
              >
                <a
                  routerLink="/products"
                  [queryParams]="{ category: 'decor' }"
                  (click)="categoryMenuOpen.set(false)"
                  class="px-4 py-3 hover:bg-primary hover:text-on-primary transition-colors border-b-2 border-primary/20"
                  >Decor</a
                >
                <a
                  routerLink="/products"
                  [queryParams]="{ category: 'bedding' }"
                  (click)="categoryMenuOpen.set(false)"
                  class="px-4 py-3 hover:bg-primary hover:text-on-primary transition-colors border-b-2 border-primary/20"
                  >Bedding</a
                >
                <a
                  routerLink="/products"
                  [queryParams]="{ category: 'lighting' }"
                  (click)="categoryMenuOpen.set(false)"
                  class="px-4 py-3 hover:bg-primary hover:text-on-primary transition-colors border-b-2 border-primary/20"
                  >Lighting</a
                >
                <a
                  routerLink="/products"
                  [queryParams]="{ category: 'dining' }"
                  (click)="categoryMenuOpen.set(false)"
                  class="px-4 py-3 hover:bg-primary hover:text-on-primary transition-colors"
                  >Dining</a
                >
              </div>
            }
          </div>
          @if (isLoggedIn()) {
            <a
              routerLink="/orders"
              routerLinkActive="bg-primary text-on-primary"
              class="text-primary hover:bg-primary hover:text-on-primary transition-colors px-2 py-1"
              >Orders</a
            >
            @if (isAdmin()) {
              <a
                routerLink="/admin/products"
                routerLinkActive="bg-primary-container text-primary"
                class="bg-primary-container text-primary border-2 border-primary hover:bg-primary hover:text-on-primary transition-colors px-2 py-1 font-bold"
                >Admin</a
              >
            }
          }
        </div>
      </div>

      <!-- Right Actions -->
      <div class="flex items-center gap-4">
        <!-- Search bar -->
        <div class="hidden md:flex border-b-4 border-primary pb-1">
          <input
            #searchInput
            (keyup.enter)="search(searchInput.value); searchInput.value = ''"
            class="bg-transparent border-none focus:ring-0 p-0 font-body placeholder-primary/50 uppercase text-sm w-36"
            placeholder="Search..."
            type="text"
          />
          <button
            (click)="search(searchInput.value); searchInput.value = ''"
            class="ml-2 font-bold p-1"
          >
            <span class="material-symbols-outlined text-xl">search</span>
          </button>
        </div>

        <!-- Cart Icon -->
        @if (isLoggedIn()) {
          <a
            routerLink="/cart"
            class="hover:bg-primary hover:text-on-primary transition-all p-2 rounded-DEFAULT relative active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            <span class="material-symbols-outlined fill" style="font-variation-settings: 'FILL' 1;"
              >shopping_cart</span
            >
            @if ((cartCount$ | async) !== 0) {
              <span
                class="absolute -top-1 -right-1 bg-secondary text-on-primary font-bold w-5 h-5 flex items-center justify-center border-2 border-primary text-xs"
              >
                {{ cartCount$ | async }}
              </span>
            }
          </a>
        }

        <!-- User Options -->
        <div class="relative flex items-center gap-2">
          @if (isLoggedIn()) {
            <div class="flex items-center gap-2">
              <span
                class="hidden lg:inline text-xs font-bold tracking-tight bg-surface-container border-2 border-primary px-2 py-1"
              >
                {{ currentUser()?.name }}
              </span>
              <button
                (click)="logout()"
                class="logout-btn relative overflow-hidden p-2 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
                title="Logout"
              >
                <span class="material-symbols-outlined relative z-10 transition-colors">logout</span>
              </button>
            </div>
          } @else {
            <div class="flex items-center gap-2">
              <a
                routerLink="/login"
                class="text-primary hover:bg-primary hover:text-on-primary transition-colors px-2 py-1"
              >
                Login
              </a>
              <a
                routerLink="/register"
                class="bg-primary text-on-primary border-2 border-primary hover:bg-secondary hover:text-primary transition-colors px-2 py-1"
              >
                Join
              </a>
            </div>
          }
        </div>

        <!-- Mobile Menu Toggle -->
        <button
          (click)="toggleMobileMenu()"
          class="md:hidden p-2 border-2 border-primary brutalist-shadow-sm active:translate-x-1 active:translate-y-1 active:shadow-none bg-primary-container"
        >
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>
    </nav>

    <!-- Mobile Dropdown Menu -->
    @if (mobileMenuOpen()) {
      <div
        class="md:hidden bg-background border-b-4 border-primary p-6 flex flex-col gap-4 font-headline uppercase font-black tracking-tighter"
      >
        <!-- Mobile Search -->
        <div class="flex border-b-4 border-primary pb-1 mb-2">
          <input
            #mobileSearchInput
            (keyup.enter)="
              search(mobileSearchInput.value); mobileSearchInput.value = ''; toggleMobileMenu()
            "
            class="bg-transparent border-none focus:ring-0 p-0 font-body placeholder-primary/50 uppercase text-sm w-full"
            placeholder="Search..."
            type="text"
          />
          <button
            (click)="
              search(mobileSearchInput.value); mobileSearchInput.value = ''; toggleMobileMenu()
            "
            class="font-bold"
          >
            <span class="material-symbols-outlined text-xl">search</span>
          </button>
        </div>

        <a
          routerLink="/products"
          (click)="toggleMobileMenu()"
          class="hover:bg-primary hover:text-on-primary transition-colors px-2 py-2"
          >Shop</a
        >

        <!-- Mobile Categories Accordion -->
        <button
          (click)="mobileCategoryOpen.set(!mobileCategoryOpen())"
          class="flex justify-between items-center hover:bg-primary hover:text-on-primary transition-colors px-2 py-2 w-full text-left"
        >
          Categories
          <span
            class="material-symbols-outlined text-base transition-transform"
            [class.rotate-180]="mobileCategoryOpen()"
            >expand_more</span
          >
        </button>
        @if (mobileCategoryOpen()) {
          <div class="flex flex-col pl-4 border-l-4 border-primary ml-2">
            <a
              routerLink="/products"
              [queryParams]="{ category: 'decor' }"
              (click)="toggleMobileMenu()"
              class="hover:bg-primary hover:text-on-primary transition-colors px-2 py-2"
              >Decor</a
            >
            <a
              routerLink="/products"
              [queryParams]="{ category: 'bedding' }"
              (click)="toggleMobileMenu()"
              class="hover:bg-primary hover:text-on-primary transition-colors px-2 py-2"
              >Bedding</a
            >
            <a
              routerLink="/products"
              [queryParams]="{ category: 'lighting' }"
              (click)="toggleMobileMenu()"
              class="hover:bg-primary hover:text-on-primary transition-colors px-2 py-2"
              >Lighting</a
            >
            <a
              routerLink="/products"
              [queryParams]="{ category: 'dining' }"
              (click)="toggleMobileMenu()"
              class="hover:bg-primary hover:text-on-primary transition-colors px-2 py-2"
              >Dining</a
            >
          </div>
        }

        @if (isLoggedIn()) {
          <a
            routerLink="/orders"
            (click)="toggleMobileMenu()"
            class="hover:bg-primary hover:text-on-primary transition-colors px-2 py-2"
            >Orders</a
          >
          @if (isAdmin()) {
            <a
              routerLink="/admin/products"
              (click)="toggleMobileMenu()"
              class="bg-primary-container border-2 border-primary text-primary hover:bg-primary hover:text-on-primary px-2 py-2"
              >Admin Dashboard</a
            >
          }
          <button
            (click)="logout(); toggleMobileMenu()"
            class="w-full text-left bg-secondary border-2 border-primary text-on-primary px-2 py-2"
          >
            Logout
          </button>
        } @else {
          <a
            routerLink="/login"
            (click)="toggleMobileMenu()"
            class="hover:bg-primary hover:text-on-primary transition-colors px-2 py-2"
            >Login</a
          >
          <a
            routerLink="/register"
            (click)="toggleMobileMenu()"
            class="bg-primary text-on-primary border-2 border-primary hover:bg-secondary hover:text-primary transition-colors px-2 py-2 text-center"
            >Join</a
          >
        }
      </div>
    }
  `,
  styles: [`
    .logout-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #dc2626;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.3s ease;
      z-index: 0;
    }
    .logout-btn:hover::before {
      transform: scaleX(1);
    }
    .logout-btn:hover span {
      color: white;
    }
  `]
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
    return this.authService.currentUserValue;
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
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
