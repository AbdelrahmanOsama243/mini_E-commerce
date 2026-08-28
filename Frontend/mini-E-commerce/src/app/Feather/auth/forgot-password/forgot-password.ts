import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/Services/auth-service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  public forgotForm: FormGroup;
  public loading = signal(false);
  public emailSent = signal(false);
  public submitted = false;

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get f() {
    return this.forgotForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.forgotForm.invalid) {
      return;
    }

    this.loading.set(true);
    const email = this.forgotForm.value.email;

    this.authService.forgetPassword(email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.emailSent.set(true);
        this.toastService.showSuccess(res.message || 'Password reset link sent to your email.');
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.showError(err.error?.message || 'Failed to send reset link.');
      },
    });
  }
}
