import { Component, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user-service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, TranslatePipe],
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
    private _userService: UserService,
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

    const payload = {
      name: this.name,
      email: this.email,
      password: this.password,
      role: 'admin'
    };

    this._userService.createAdmin(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMsg = 'Admin account created successfully!';
        this.name = '';
        this.email = '';
        this.password = '';
        this.confirmPassword = '';
        this._cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMsg = err?.error?.message || 'Failed to create admin account.';
        this._cdr.detectChanges();
      }
    });
  }
}


