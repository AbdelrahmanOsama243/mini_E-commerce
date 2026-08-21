import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/Services/auth-service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './verify-email.html',
})
export class VerifyEmailComponent implements OnInit {
  isLoading: boolean = true;
  isSuccess: boolean = false;
  message: string = 'Verifying your email address...';

  // Removed resend state as users need to register again for a new token

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');

    // Removed pre-fill email logic

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

        // If they are logged in, we should refresh the user profile to get the isVerified flag
        if (this.authService.isLoggedIn()) {
          this.authService.getMe().subscribe({
            next: (res) => {
              const user = res.data ?? res;
              // Re-save session with updated user
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
