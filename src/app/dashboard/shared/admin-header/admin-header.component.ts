import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ModalService } from '../../../core/services/modal.service';
import { AuthService } from '../../../core/services/auth-service';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { SocketService } from '../../../core/services/socket.service';
import { Subscription } from 'rxjs';
import { OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';

import { LogoComponent } from '../../../shared/logo/logo.component';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe, LogoComponent],
  templateUrl: './admin-header.component.html'
})
export class AdminHeader implements OnInit, OnDestroy {
  public langService = inject(LanguageService);
  public themeService = inject(ThemeService);

  isMobileMenuOpen = false;
  isMoreAdminDropdownOpen = false;
  
  unreadMessagesCount = 0;
  private socketSub!: Subscription;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    if (this.isMoreAdminDropdownOpen && !target.closest('.admin-more-dropdown-wrapper')) {
      this.isMoreAdminDropdownOpen = false;
    }

    if (this.isMobileMenuOpen && !target.closest('.admin-mobile-menu-wrapper') && !target.closest('.admin-mobile-hamburger-btn')) {
      this.isMobileMenuOpen = false;
    }
  }

  constructor(
    private _router: Router,
    private _authService: AuthService,
    private _modalService: ModalService,
    private _socketService: SocketService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Listen to real-time incoming messages
    this.socketSub = this._socketService.onEvent('new_contact_message').subscribe(() => {
      this.unreadMessagesCount++;
      this._cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
  }

  get isSuperAdmin(): boolean {
    return this._authService.isSuperAdmin();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.isMoreAdminDropdownOpen = false;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleMoreAdminDropdown(): void {
    this.isMoreAdminDropdownOpen = !this.isMoreAdminDropdownOpen;
  }

  closeMoreAdminDropdown(): void {
    this.isMoreAdminDropdownOpen = false;
  }

  async logout() {
    const confirmed = await this._modalService.confirm({
      title: 'Confirm Admin Logout',
      message: 'Are you sure you want to log out of the Admin Dashboard?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (confirmed) {
      this._authService.logout();
      this._router.navigate(['/login']);
    }
  }
}
