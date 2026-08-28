import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/Services/auth-service';

@Component({
  selector: 'app-verify-email',
  standalone: false,
  templateUrl: './verify-email.html',
})
export class VerifyEmailComponent implements OnInit {
  isLoading: boolean = true;
  isSuccess: boolean = false;
  message: string = 'Verifying your email address...';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');

    if (token) {
      this.verifyUserToken(token);
    } else {
      this.isLoading = false;
      this.isSuccess = false;
      this.message = 'Verification link is invalid or missing.';
    }
  }

  verifyUserToken(token: string): void {
    this.authService.verifyEmail(token).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isSuccess = true;
        this.message = response.message || 'Your account has been successfully verified!';

        if (this.authService.isLoggedIn()) {
          this.authService.getMe().subscribe({
            next: (res) => {
              const user = res.data ?? res;
              const token = this.authService.getAccessToken();
              this.authService.saveSession(user as any, token || '');
            },
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isSuccess = false;
        this.message = err.error?.message || 'Invalid or expired verification token.';
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
