import { Component, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { env } from '../../../../env/env';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './add-user.component.html'
})
export class AddUser {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = false;

  errorMsg = '';
  successMsg = '';

  constructor(
    private _http: HttpClient,
    private _cdr: ChangeDetectorRef
  ) {}

  onCreateAdmin() {
    this.errorMsg = '';
    this.successMsg = '';

    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.errorMsg = 'Please fill in all required fields.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this._cdr.detectChanges();

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const payload = {
      name: this.name,
      email: this.email,
      password: this.password,
      role: 'admin'
    };

    // Correct backend route: /api/v1/user/admin (singular) using env.apiURL
    this._http.post(`${env.apiURL}user/admin`, payload, { headers }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMsg = 'Admin account created successfully!';
        this.name = '';
        this.email = '';
        this.password = '';
        this.confirmPassword = '';
        this._cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err?.error?.message || 'Failed to create admin account.';
        this._cdr.detectChanges();
      }
    });
  }
}
