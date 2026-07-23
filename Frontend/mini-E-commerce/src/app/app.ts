import { Component, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('mini-E-commerce');
  private router = inject(Router);
  public showNavbar = true;

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
}
