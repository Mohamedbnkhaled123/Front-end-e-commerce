import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';
import { CartService } from '../../core/services/cart.service';

import { ModalService } from '../../core/services/modal.service';

import { TranslatePipe } from '../../core/pipes/translate.pipe';

import { LogoComponent } from '../../shared/logo/logo.component';
import { validateEmail } from '../../core/validators/email.validator';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe, LogoComponent],
  templateUrl: './login.component.html'
})
export class Login {
  email = '';
  password = '';
  isLoading = false;

  /** Inline email format error shown before any server request */
  emailError = '';

  isEmptyFields = false;
  isNotRegistered = false;
  isInvalidCredentials = false;
  isServerError = false;
  serverErrorMsg = '';

  // Reset Password Modal State
  showResetModal = false;
  resetStep: 'request' | 'verify' = 'request';
  resetEmail = '';
  resetOtp = '';
  resetNewPassword = '';
  resetConfirmPassword = '';
  devOtpHint = '';
  isResetting = false;
  resetError = '';
  resetSuccess = '';

  // Demo Accounts Data
  demoAccounts = [
    {
      role: 'Customer / User',
      email: 'memo456@gmail.com',
      password: 'Id1234567',
      theme: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      permissions: 'E-commerce Storefront Browsing, Cart Management, Checkout, Order Tracking & Personal Profile.'
    },
    {
      role: 'System Admin',
      email: 'memo256@gmail.com',
      password: 'Admin//123789',
      theme: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      permissions: 'Product Catalog Management, Category Operations, Inventory Tracking & Order Status Updates.'
    },
    {
      role: 'Super Admin',
      email: 'superadmin222@gmail.com',
      password: 'Id123456',
      theme: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      permissions: 'Complete System Governance, User Management, Role Assignments, Financial Analytics & Platform Settings.'
    }
  ];

  copiedField = '';
  showDemoAccounts = false;

  constructor(
    private _authService: AuthService,
    private _cartService: CartService,
    private _modalService: ModalService,
    private _cdr: ChangeDetectorRef
  ) {}

  openResetModal() {
    this.showResetModal = true;
    this.resetStep = 'request';
    this.resetEmail = this.email || '';
    this.resetOtp = '';
    this.resetNewPassword = '';
    this.resetConfirmPassword = '';
    this.devOtpHint = '';
    this.resetError = '';
    this.resetSuccess = '';
  }

  closeResetModal() {
    this.showResetModal = false;
  }

  // Step 1: Requests OTP reset code
  onRequestResetOtp() {
    this.resetError = '';
    this.resetSuccess = '';
    this.devOtpHint = '';

    const emailResult = validateEmail(this.resetEmail);
    if (!emailResult.valid) {
      this.resetError = emailResult.error!;
      return;
    }
    // Use sanitized (trimmed + lowercased) value
    this.resetEmail = emailResult.sanitized;

    this.isResetting = true;
    this._cdr.detectChanges();

    this._authService.forgotPassword(this.resetEmail).subscribe({
      next: (res) => {
        this.isResetting = false;
        this.resetStep = 'verify';
        this.resetSuccess = res.message || 'Reset code generated! Please check your email or console.';
        if (res.devOtp) {
          this.devOtpHint = res.devOtp;
          this.resetOtp = res.devOtp; // Auto-fill in dev mode for convenience
        }
        this._cdr.detectChanges();
      },
      error: (err) => {
        this.isResetting = false;
        this.resetError = err?.error?.message || 'Failed to send reset code. Please try again.';
        this._cdr.detectChanges();
      }
    });
  }

  // Step 2: Verifies OTP code and updates password
  onConfirmResetPassword() {
    this.resetError = '';
    this.resetSuccess = '';

    if (!this.resetOtp || !this.resetNewPassword || !this.resetConfirmPassword) {
      this.resetError = 'Please enter verification code and new password.';
      return;
    }

    if (this.resetNewPassword !== this.resetConfirmPassword) {
      this.resetError = 'Passwords do not match.';
      return;
    }

    if (!this._authService.validatePasswordStrength(this.resetNewPassword)) {
      this.resetError = 'Password must be at least 8 characters long and contain uppercase, lowercase, and a number.';
      return;
    }

    this.isResetting = true;
    this._cdr.detectChanges();

    this._authService.resetPassword({
      email: this.resetEmail,
      otp: this.resetOtp,
      newPassword: this.resetNewPassword
    }).subscribe({
      next: async () => {
        this.isResetting = false;
        const newPass = this.resetNewPassword;
        const userEmail = this.resetEmail;
        this.closeResetModal();

        this.email = userEmail;
        this.password = newPass;
        this._cdr.detectChanges();

        await this._modalService.alert({
          title: 'Password Updated!',
          message: 'Your password has been updated successfully. Click OK to log in to your account.',
          type: 'success'
        });

        this.onLogin();
      },
      error: (err) => {
        this.isResetting = false;
        this.resetError = err?.error?.message || 'Failed to reset password. Please verify your OTP code.';
        this._cdr.detectChanges();
      }
    });
  }

  onLogin() {
    this.emailError = '';
    this.isEmptyFields = false;
    this.isNotRegistered = false;
    this.isInvalidCredentials = false;
    this.isServerError = false;
    this.serverErrorMsg = '';

    if (!this.email || !this.password) {
      this.isEmptyFields = true;
      return;
    }

    const emailResult = validateEmail(this.email);
    if (!emailResult.valid) {
      this.emailError = emailResult.error!;
      return;
    }
    // Use sanitized (trimmed + lowercased) value before sending to server
    this.email = emailResult.sanitized;

    this.isLoading = true;
    this._cdr.detectChanges();

    this._authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isLoading = false;
        this._cartService.fetchCartFromDB().subscribe();
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

  fillDemoAccount(account: any, event?: Event) {
    this.email = account.email;
    this.password = account.password;
    this._cdr.detectChanges();

    if (event) {
      this.playAutoFillAnimation(event);
    }
  }

  private playAutoFillAnimation(event: Event) {
    const sourceElement = (event.target as HTMLElement).closest('.group') || event.target as HTMLElement;
    const targetElement = document.getElementById('email');
    if (!sourceElement || !targetElement) return;

    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    const clone = document.createElement('div');
    clone.style.position = 'fixed';
    clone.style.zIndex = '99999';
    clone.style.left = String(sourceRect.left) + 'px';
    clone.style.top = String(sourceRect.top) + 'px';
    clone.style.width = String(sourceRect.width) + 'px';
    clone.style.height = String(sourceRect.height) + 'px';
    clone.style.borderRadius = '12px';
    clone.style.pointerEvents = 'none';
    clone.style.backgroundColor = '#3b82f6';
    clone.style.opacity = '0.3';
    clone.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
    clone.style.transition = 'all 480ms cubic-bezier(0.2, 1, 0.3, 1)';
    
    document.body.appendChild(clone);

    const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
    const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

    requestAnimationFrame(() => {
      clone.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.1)`;
      clone.style.opacity = '0.8';
    });

    setTimeout(() => {
      if (clone.parentNode) clone.parentNode.removeChild(clone);
    }, 480);
  }

  copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedField = field;
      this._cdr.detectChanges();
      setTimeout(() => {
        this.copiedField = '';
        this._cdr.detectChanges();
      }, 2000);
    });
  }
}
