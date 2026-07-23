import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <app-loading-spinner [visible]="loading()"></app-loading-spinner>
    
    <div class="flex-grow flex items-center justify-center px-6 py-16 md:py-24">
      <div class="bg-surface-container brutalist-border p-8 md:p-12 w-full max-w-md brutalist-shadow">
        <h1 class="font-headline font-black text-4xl md:text-5xl uppercase tracking-tighter mb-8 border-b-4 border-primary pb-4">
          Login
        </h1>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
          <!-- Email Field -->
          <div class="flex flex-col gap-2">
            <label for="email" class="font-headline font-bold uppercase tracking-tight text-sm">
              Email Address
            </label>
            <input 
              id="email" 
              type="email" 
              formControlName="email"
              class="brutalist-border p-3 font-body bg-background focus:ring-0 focus:border-secondary outline-none uppercase text-sm"
              placeholder="e.g. user@example.com"
            />
            @if (submitted && f['email'].errors) {
              <span class="text-secondary font-bold text-xs uppercase tracking-tight">
                @if (f['email'].errors['required']) { Email is required }
                @else if (f['email'].errors['email']) { Enter a valid email address }
              </span>
            }
          </div>

          <!-- Password Field -->
          <div class="flex flex-col gap-2">
            <label for="password" class="font-headline font-bold uppercase tracking-tight text-sm">
              Password
            </label>
            <input 
              id="password" 
              type="password" 
              formControlName="password"
              class="brutalist-border p-3 font-body bg-background focus:ring-0 focus:border-secondary outline-none text-sm"
              placeholder="••••••••"
            />
            @if (submitted && f['password'].errors) {
              <span class="text-secondary font-bold text-xs uppercase tracking-tight">
                Password is required
              </span>
            }
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            class="w-full py-4 mt-4 bg-primary text-on-primary text-xl brutalist-button brutalist-shadow brutalist-shadow-hover"
          >
            Sign In
          </button>
        </form>

        <div class="mt-8 text-center border-t-2 border-primary pt-6">
          <p class="font-body text-sm text-on-surface-variant mb-2">New to MiniStore?</p>
          <a routerLink="/register" class="font-headline font-black uppercase text-secondary hover:underline tracking-tight">
            Create an account
          </a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public loginForm: FormGroup;
  public loading = signal(false);
  public submitted = false;
  private returnUrl: string = '/';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastService.showSuccess('Logged in successfully!');
        this.router.navigateByUrl(this.returnUrl);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
