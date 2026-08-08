import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { LogoComponent } from '../../shared/logo/logo.component';

@Component({
  selector: 'app-superadmin-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LogoComponent],
  templateUrl: './superadmin-setup.component.html'
})
export class SuperadminSetup {
  name = '';
  email = '';
  setupKey = '';
  password = '';
  confirmPassword = '';
  isLoading = false;

  errorMsg = '';
  successMsg = '';

  constructor(
    private _authService: AuthService,
    private _cdr: ChangeDetectorRef
  ) {}

  onClaimSuperAdmin() {
    this.errorMsg = '';
    this.successMsg = '';

    if (!this.name || !this.email || !this.setupKey || !this.password || !this.confirmPassword) {
      this.errorMsg = 'Please complete all required fields.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'Passwords do not match.';
      return;
    }

    if (!this._authService.validatePasswordStrength(this.password)) {
      this.errorMsg = 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number.';
      return;
    }

    this.isLoading = true;
    this._cdr.detectChanges();

    this._authService.setupSuperAdmin({
      name: this.name,
      email: this.email,
      setupKey: this.setupKey,
      password: this.password
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMsg = 'Super Admin account successfully claimed and initialized!';
        this._cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMsg = err?.error?.message || 'Failed to setup Super Admin account. Please verify your Setup Key.';
        this._cdr.detectChanges();
      }
    });
  }
}
