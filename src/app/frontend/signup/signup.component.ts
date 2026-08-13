import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ICanComponentDeactivate } from '../../core/models/canDeactivate.model';
import { ModalService } from '../../core/services/modal.service';
import { AuthService } from '../../core/services/auth-service';
import { LogoComponent } from '../../shared/logo/logo.component';
import { validateEmail } from '../../core/validators/email.validator';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [TranslatePipe, CommonModule, RouterLink, FormsModule, LogoComponent],
  templateUrl: './signup.component.html'
})
export class Signup implements ICanComponentDeactivate {
  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  isFormDirty = false;

  isLoading = false;
  errorMsg = '';
  successMsg = '';

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
    private _modalService: ModalService,
    private _router: Router,
    private _cdr: ChangeDetectorRef
  ) {}

  get isPasswordValid(): boolean {
    return this._authService.validatePasswordStrength(this.password);
  }

  async canDeactivate(): Promise<boolean> {
    if (this.isFormDirty && !this.successMsg) {
      return await this._modalService.confirm({
        title: 'Unsaved Registration Changes',
        message: 'Are you sure you want to leave without completing your signup registration?',
        confirmText: 'Leave Page',
        cancelText: 'Stay',
        type: 'warning'
      });
    }
    return true;
  }

  onFormInput() {
    this.isFormDirty = true;
  }

  onSignup() {
    this.errorMsg = '';
    this.successMsg = '';

    if (!this.name || !this.email || !this.password) {
      this.errorMsg = 'Please fill in all required fields.';
      return;
    }

    const emailCheck = validateEmail(this.email);
    if (!emailCheck.valid) {
      this.errorMsg = emailCheck.error!;
      return;
    }
    this.email = emailCheck.sanitized;

    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'Passwords do not match.';
      return;
    }

    if (!this._authService.validatePasswordStrength(this.password)) {
      this.errorMsg = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.';
      return;
    }

    if (this.phone) {
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(this.phone.trim())) {
        this.errorMsg = 'Please enter a valid phone number (10-15 digits, optional +).';
        return;
      }
    }

    this.isLoading = true;
    this._cdr.detectChanges();

    const payload = {
      name: this.name.trim(),
      email: this.email.trim(),
      password: this.password,
      phoneNumbers: this.phone ? [this.phone.trim()] : undefined
    };

    this._authService.register(payload).subscribe({
      next: () => {
        this.successMsg = 'Registration successful! Redirecting to store...';
        this.isFormDirty = false;
        
        // Auto-login after successful registration
        this._authService.login({ email: this.email.trim(), password: this.password }).subscribe({
          next: () => {
             this.isLoading = false;
             this._cdr.detectChanges();
          },
          error: () => {
             this.isLoading = false;
             this._cdr.detectChanges();
             this._router.navigate(['/login']);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err?.error?.message || 'Registration failed. Email might already exist.';
        this._cdr.detectChanges();
      }
    });
  }

  fillDemoAccount(account: any, event?: Event) {
    this.name = 'Demo ' + account.role;
    this.email = account.email;
    this.password = account.password;
    this.confirmPassword = account.password;
    this.isFormDirty = true;
    this._cdr.detectChanges();

    if (event) {
      this.playAutoFillAnimation(event);
    }
  }

  private playAutoFillAnimation(event: Event) {
    const sourceElement = (event.target as HTMLElement).closest('.group') || event.target as HTMLElement;
    const targetElement = document.getElementById('name');
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
      
      const emailTarget = document.getElementById('email');
      const passTarget = document.getElementById('password');
      const confirmTarget = document.getElementById('confirmPassword');
      
      [targetElement, emailTarget, passTarget, confirmTarget].forEach(el => {
        if (el) el.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-900/30');
      });
      
      setTimeout(() => {
        [targetElement, emailTarget, passTarget, confirmTarget].forEach(el => {
          if (el) el.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-900/30');
        });
      }, 500);

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


