import { Component, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/Services/auth-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('mini-E-commerce');
  private router = inject(Router);
  private authService = inject(AuthService);
  public showNavbar = true;

  constructor() {
    // Attempt to silently refresh token on app load
    this.authService.initAuth().subscribe();

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
}
