import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html'
})
export class Login {
  email = '';
  password = '';
  isLoading = false;

  isEmptyFields = false;
  isNotRegistered = false;
  isInvalidCredentials = false;
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
    private _cartService: CartService,
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

  onLogin() {
    this.isEmptyFields = false;
    this.isNotRegistered = false;
    this.isInvalidCredentials = false;
    this.isServerError = false;
    this.serverErrorMsg = '';

    if (!this.email || !this.password) {
      this.isEmptyFields = true;
      return;
    }

    this.isLoading = true;
    this._cdr.detectChanges();

    this._authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isLoading = false;
        this._cartService.syncCartOnLogin();
        this._cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 404 || (err.error?.message || '').toLowerCase().includes('not found')) {
          this.isNotRegistered = true;
        } else if (err.status === 401) {
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
