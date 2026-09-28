import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/Services/auth-service';
import { ToastService } from '../../../shared/toast/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css',
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
  public resendingVerification = signal(false);
  private returnUrl: string = '/';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.submitted = true;
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
      },
    });
  }

  resendVerification() {
    const email = this.f['email'].value;
    if (!email) {
      this.toastService.showInfo('Email Required - Please enter your email address first.');
      return;
    }
    this.resendingVerification.set(true);
    this.authService.resendVerification({ name: 'User', email, password: 'placeholder' }).subscribe({
      next: () => {
        this.resendingVerification.set(false);
        this.toastService.showSuccess('Verification Sent - If this email is registered, a verification link has been sent.');
      },
      error: () => {
        this.resendingVerification.set(false);
        // Don't reveal if email exists or not
        this.toastService.showSuccess('Verification Sent - If this email is registered, a verification link has been sent.');
      },
    });
  }
}
