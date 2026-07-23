import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner';

function passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (!password || !confirmPassword) return null;
  return password.value === confirmPassword.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <app-loading-spinner [visible]="loading()"></app-loading-spinner>
    
    <div class="flex-grow flex items-center justify-center px-6 py-16 md:py-24">
      <div class="bg-surface-container brutalist-border p-8 md:p-12 w-full max-w-md brutalist-shadow">
        <h1 class="font-headline font-black text-4xl md:text-5xl uppercase tracking-tighter mb-8 border-b-4 border-primary pb-4">
          Register
        </h1>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
          <!-- Name Field -->
          <div class="flex flex-col gap-2">
            <label for="name" class="font-headline font-bold uppercase tracking-tight text-sm">
              Full Name
            </label>
            <input 
              id="name" 
              type="text" 
              formControlName="name"
              class="brutalist-border p-3 font-body bg-background focus:ring-0 focus:border-secondary outline-none uppercase text-sm"
              placeholder="e.g. John Doe"
            />
            @if (submitted && f['name'].errors) {
              <span class="text-secondary font-bold text-xs uppercase tracking-tight">
                @if (f['name'].errors['required']) { Name is required }
                @else if (f['name'].errors['minlength']) { Name must be at least 2 characters }
              </span>
            }
          </div>

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
              <span class="text-secondary font-bold text-xs uppercase tracking-tight block max-w-sm">
                @if (f['password'].errors['required']) { Password is required }
                @else if (f['password'].errors['pattern']) { Password must be 8+ chars with uppercase, lowercase, number, and special char }
              </span>
            }
          </div>

          <!-- Confirm Password Field -->
          <div class="flex flex-col gap-2">
            <label for="confirmPassword" class="font-headline font-bold uppercase tracking-tight text-sm">
              Confirm Password
            </label>
            <input 
              id="confirmPassword" 
              type="password" 
              formControlName="confirmPassword"
              class="brutalist-border p-3 font-body bg-background focus:ring-0 focus:border-secondary outline-none text-sm"
              placeholder="••••••••"
            />
            @if (submitted && registerForm.errors?.['mismatch']) {
              <span class="text-secondary font-bold text-xs uppercase tracking-tight">
                Passwords do not match
              </span>
            }
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            class="w-full py-4 mt-4 bg-primary text-on-primary text-xl brutalist-button brutalist-shadow brutalist-shadow-hover"
          >
            Create Account
          </button>
        </form>

        <div class="mt-8 text-center border-t-2 border-primary pt-6">
          <p class="font-body text-sm text-on-surface-variant mb-2">Already have an account?</p>
          <a routerLink="/login" class="font-headline font-black uppercase text-secondary hover:underline tracking-tight">
            Sign In Instead
          </a>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  public registerForm: FormGroup;
  public loading = signal(false);
  public submitted = false;

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  get f() {
    return this.registerForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.registerForm.invalid) {
      return;
    }

    this.loading.set(true);
    const { name, email, password } = this.registerForm.value;
    
    this.authService.register({ name, email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastService.showSuccess('Registered and logged in successfully!');
        this.router.navigate(['/']);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
