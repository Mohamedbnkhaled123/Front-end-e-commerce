import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserService } from '../../core/services/user-service';
import { AuthService } from '../../core/services/auth-service';
import { LanguageService } from '../../core/services/language.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { CustomSelectComponent, SelectOption } from '../../shared/custom-select/custom-select.component';
import { IUser } from '../../core/models/user.model';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, CustomSelectComponent],
  templateUrl: './users-list.component.html'
})
export class UsersList implements OnInit, OnDestroy {
  users: IUser[] = [];
  filteredUsers: IUser[] = [];
  isLoading = false;
  togglingUserId: string | null = null;
  deletingUserId: string | null = null;

  // Search & Filter state
  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  private subscriptions = new Subscription();

  get roleOptions(): SelectOption[] {
    return [
      { value: '', label: this._langService.translate('admin.all_roles') },
      { value: 'superadmin', label: this._langService.translate('admin.role_superadmin') },
      { value: 'admin', label: this._langService.translate('admin.role_admin') },
      { value: 'user', label: this._langService.translate('admin.role_user') }
    ];
  }

  get statusOptions(): SelectOption[] {
    return [
      { value: '', label: this._langService.translate('admin.all_status') },
      { value: 'active', label: this._langService.translate('admin.active') },
      { value: 'deactivated', label: this._langService.translate('admin.deactivated') }
    ];
  }

  constructor(
    private _userService: UserService,
    private _authService: AuthService,
    private _cdr: ChangeDetectorRef,
    public _langService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  get isSuperAdmin(): boolean {
    return this._authService.isSuperAdmin();
  }

  loadUsers(): void {
    this.isLoading = true;
    this._cdr.detectChanges();

    const sub = this._userService.getUsers().subscribe({
      next: (res) => {
        this.users = res.data || [];
        this.applyFilter();
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.isLoading = false;
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  applyFilter(): void {
    let result = [...this.users];

    // 1. Search Filter (by name or email)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(u => 
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term))
      );
    }

    // 2. Role Filter
    if (this.selectedRole) {
      result = result.filter(u => u.role === this.selectedRole);
    }

    // 3. Status Filter
    if (this.selectedStatus === 'active') {
      result = result.filter(u => u.isActive !== false);
    } else if (this.selectedStatus === 'deactivated') {
      result = result.filter(u => u.isActive === false);
    }

    this.filteredUsers = result;
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize) || 1;

    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedUsers(): IUser[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  get pageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this._cdr.detectChanges();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this._cdr.detectChanges();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this._cdr.detectChanges();
    }
  }

  toggleStatus(user: IUser): void {
    if (!user._id || this.togglingUserId) return;
    this.togglingUserId = user._id;
    this._cdr.detectChanges();

    const sub = this._userService.toggleUserStatus(user._id).subscribe({
      next: (res) => {
        if (res && res.data) {
          user.canPurchase = res.data.canPurchase;
        } else {
          user.canPurchase = !(user.canPurchase !== false);
        }
        this.togglingUserId = null;
        this._cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to toggle purchase status:', err);
        this.togglingUserId = null;
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  toggleAdminStatus(user: IUser): void {
    if (!user._id || this.togglingUserId) return;
    this.togglingUserId = user._id;
    this._cdr.detectChanges();

    const sub = this._userService.toggleAdminStatus(user._id).subscribe({
      next: (res) => {
        if (res && res.data) {
          user.isActive = res.data.isActive;
        } else {
          user.isActive = !(user.isActive !== false);
        }
        this.applyFilter();
        this.togglingUserId = null;
        this._cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to toggle admin active status:', err);
        this.togglingUserId = null;
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  deleteAdmin(user: IUser): void {
    if (!user._id || this.deletingUserId) return;
    if (!confirm('Are you sure you want to delete this admin user account?')) return;

    this.deletingUserId = user._id;
    this._cdr.detectChanges();

    const sub = this._userService.deleteAdmin(user._id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u._id !== user._id);
        this.applyFilter();
        this.deletingUserId = null;
        this._cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to delete admin:', err);
        this.deletingUserId = null;
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
