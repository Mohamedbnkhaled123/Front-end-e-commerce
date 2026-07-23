import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ICanComponentDeactivate } from '../../core/models/canDeactivate.model';
import { ModalService } from '../../core/services/modal.service';
import { env } from '../../../env/env';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './signup.component.html'
})
export class Signup implements ICanComponentDeactivate {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  isFormDirty = false;

  isLoading = false;
  errorMsg = '';
  successMsg = '';

  constructor(
    private _http: HttpClient,
    private _modalService: ModalService,
    private _router: Router,
    private _cdr: ChangeDetectorRef
  ) {}

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

    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this._cdr.detectChanges();

    const payload = {
      name: this.name,
      email: this.email,
      password: this.password
    };

    this._http.post<{ status: string; message?: string }>(`${env.apiURL}auth/register`, payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMsg = 'Registration successful! Redirecting to login...';
        this.isFormDirty = false;
        this._cdr.detectChanges();
        setTimeout(() => {
          this._router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err?.error?.message || 'Registration failed. Email might already exist.';
        this._cdr.detectChanges();
      }
    });
  }
}
