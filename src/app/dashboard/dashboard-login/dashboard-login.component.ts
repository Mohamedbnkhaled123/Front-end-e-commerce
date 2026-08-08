import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';
import { ModalService } from '../../core/services/modal.service';

import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LogoComponent } from '../../shared/logo/logo.component';

@Component({
  selector: 'app-dashboard-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe, LogoComponent],
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
  resetStep: 'request' | 'verify' = 'request';
  resetEmail = '';
  resetOtp = '';
  resetNewPassword = '';
  resetConfirmPassword = '';
  devOtpHint = '';
  isResetting = false;
  resetError = '';
  resetSuccess = '';

  constructor(
    private _authService: AuthService,
    private _route: ActivatedRoute,
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

  onRequestResetOtp() {
    this.resetError = '';
    this.resetSuccess = '';
    this.devOtpHint = '';

    if (!this.resetEmail || !this.resetEmail.includes('@')) {
      this.resetError = 'Please enter a valid email address.';
      return;
    }

    this.isResetting = true;
    this._cdr.detectChanges();

    this._authService.forgotPassword(this.resetEmail).subscribe({
      next: (res) => {
        this.isResetting = false;
        this.resetStep = 'verify';
        this.resetSuccess = res.message || 'Reset code generated! Please check your email or console.';
        if (res.devOtp) {
          this.devOtpHint = res.devOtp;
          this.resetOtp = res.devOtp;
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

        this.onAdminLogin();
      },
      error: (err) => {
        this.isResetting = false;
        this.resetError = err?.error?.message || 'Failed to reset password. Please verify your OTP code.';
        this._cdr.detectChanges();
      }
    });
  }

  superAdminExists = true;

  ngOnInit(): void {
    const errorParam = this._route.snapshot.queryParams['error'];
    if (errorParam === 'unauthorized') {
      this.isNotAdminUser = true;
      this._cdr.detectChanges();
    }

    this._authService.checkSuperAdminStatus().subscribe({
      next: (res) => {
        this.superAdminExists = res.exists;
        this._cdr.detectChanges();
      },
      error: () => {}
    });
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
