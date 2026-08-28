import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/Services/auth-service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.html',
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  public resetForm: FormGroup;
  public loading = signal(false);
  public token: string | null = null;
  public submitted = false;

  constructor() {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token');
    if (!this.token) {
      this.toastService.showError('Invalid or missing password reset token');
      this.router.navigate(['/login']);
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  get f() {
    return this.resetForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.resetForm.invalid || !this.token) {
      return;
    }

    this.loading.set(true);
    const password = this.resetForm.value.password;

    this.authService.resetPassword(this.token, password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toastService.showSuccess(res.message || 'Password reset successfully! Please log in.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.showError(err.error?.message || 'Failed to reset password. The link may have expired.');
      },
    });
  }
}
