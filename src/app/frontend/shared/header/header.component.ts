import { Component, inject, signal, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth-service';
import { LogoComponent } from '../../../shared/logo/logo.component';
import { CartService } from '../../../core/services/cart.service';
import { ModalService } from '../../../core/services/modal.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe, LogoComponent],
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {
  public langService = inject(LanguageService);
  public themeService = inject(ThemeService);
  public authService = inject(AuthService);
  public cartService = inject(CartService);
  public modalService = inject(ModalService);

  isMobileMenuOpen = signal<boolean>(false);
  isMoreDropdownOpen = signal<boolean>(false);
  isUserMenuOpen = signal<boolean>(false);
  
  isLoggedIn$: Observable<string | null> | undefined;

  get isAdmin(): boolean {
    const role = this.authService.isUser();
    return role === 'admin' || role === 'superadmin';
  }

  ngOnInit() {
    this.authService.onInitAuth();
    this.isLoggedIn$ = this.authService.isLogedIn();
  }

  async logout() {
    this.closeMobileMenu();
    this.closeMoreDropdown();
    this.closeUserMenu();
    
    const confirmed = await this.modalService.confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out of your account?',
      confirmText: 'Yes, Logout',
      cancelText: 'Cancel',
      type: 'danger'
    });
    
    if (confirmed) {
      this.authService.logout();
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
    this.isMoreDropdownOpen.set(false);
    this.isUserMenuOpen.set(false);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  toggleMoreDropdown(): void {
    this.isMoreDropdownOpen.update(v => !v);
    this.isUserMenuOpen.set(false);
  }

  closeMoreDropdown(): void {
    this.isMoreDropdownOpen.set(false);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(v => !v);
    this.isMoreDropdownOpen.set(false);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    if (this.isUserMenuOpen() && !target.closest('.user-menu-wrapper')) {
      this.isUserMenuOpen.set(false);
    }

    if (this.isMoreDropdownOpen() && !target.closest('.more-dropdown-wrapper')) {
      this.isMoreDropdownOpen.set(false);
    }

    if (this.isMobileMenuOpen() && !target.closest('.mobile-menu-wrapper') && !target.closest('.mobile-hamburger-btn')) {
      this.isMobileMenuOpen.set(false);
    }
  }
}
