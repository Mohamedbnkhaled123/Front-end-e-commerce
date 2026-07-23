import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-dashboard-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard-login.component.html'
})
export class DashboardLogin implements OnInit {
  email = '';
  password = '';
  isLoading = false;

  isEmptyFields = false;
  isInvalidCredentials = false;
  isNotAdminUser = false;
  isServerError = false;
  serverErrorMsg = '';

  // Reset Password Modal State
  showResetModal = false;
  resetEmail = '';
  resetNewPassword = '';
  resetConfirmPassword = '';
  isResetting = false;
  resetError = '';
  resetSuccess = '';

  constructor(
    private _authService: AuthService,
    private _route: ActivatedRoute,
    private _cdr: ChangeDetectorRef
  ) {}

  openResetModal() {
    this.showResetModal = true;
    this.resetEmail = this.email || '';
    this.resetNewPassword = '';
    this.resetConfirmPassword = '';
    this.resetError = '';
    this.resetSuccess = '';
  }

  closeResetModal() {
    this.showResetModal = false;
  }

  onResetPassword() {
    this.resetError = '';
    this.resetSuccess = '';

    if (!this.resetEmail || !this.resetNewPassword || !this.resetConfirmPassword) {
      this.resetError = 'Please fill in all fields.';
      return;
    }

    if (this.resetNewPassword !== this.resetConfirmPassword) {
      this.resetError = 'Passwords do not match.';
      return;
    }

    if (this.resetNewPassword.length < 6) {
      this.resetError = 'New password must be at least 6 characters long.';
      return;
    }

    this.isResetting = true;
    this._cdr.detectChanges();

    this._authService.resetPassword({
      email: this.resetEmail,
      newPassword: this.resetNewPassword
    }).subscribe({
      next: (res) => {
        this.isResetting = false;
        this.resetSuccess = res.message || 'Password reset successfully!';
        this.email = this.resetEmail;
        this._cdr.detectChanges();
        setTimeout(() => {
          this.closeResetModal();
        }, 2000);
      },
      error: (err) => {
        this.isResetting = false;
        this.resetError = err?.error?.message || 'Failed to reset password. Please try again.';
        this._cdr.detectChanges();
      }
    });
  }

  ngOnInit(): void {
    const errorParam = this._route.snapshot.queryParams['error'];
    if (errorParam === 'unauthorized') {
      this.isNotAdminUser = true;
      this._cdr.detectChanges();
    }
  }

  onAdminLogin() {
    this.isEmptyFields = false;
    this.isInvalidCredentials = false;
    this.isNotAdminUser = false;
    this.isServerError = false;
    this.serverErrorMsg = '';

    if (!this.email || !this.password) {
      this.isEmptyFields = true;
      return;
    }

    this.isLoading = true;
    this._cdr.detectChanges();

    this._authService.adminLogin({ email: this.email, password: this.password }).subscribe({
      next: (role) => {
        this.isLoading = false;
        if (role !== 'admin') {
          this.isNotAdminUser = true;
          this._authService.clearTokenWithoutRedirect();
        }
        this._cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401 || err.status === 404) {
          this.isInvalidCredentials = true;
        } else {
          this.isServerError = true;
          this.serverErrorMsg = err?.error?.message || 'Server connection failed.';
        }
        this._cdr.detectChanges();
      }
    });
  }
}
