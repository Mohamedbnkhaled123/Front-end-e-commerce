import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';
import { ModalService } from '../core/services/modal.service';
import { AuthService } from '../core/services/auth-service';
import { CartService } from '../core/services/cart.service';

@Component({
  selector: 'app-frontend',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConfirmModalComponent],
  templateUrl: './frontend.html'
})
export class Frontend implements OnInit {
  isLoggedIn = false;

  constructor(
    private _router: Router, 
    private _authService: AuthService,
    public cartService: CartService,
    private _modalService: ModalService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkLoginStatus();
    this._router.events.subscribe(() => {
      this.checkLoginStatus();
    });
  }

  checkLoginStatus(): void {
    const token = localStorage.getItem('token');
    this.isLoggedIn = !!token;
    this._cdr.detectChanges();
  }

  async logout(): Promise<void> {
    const confirmed = await this._modalService.confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out of your account?',
      confirmText: 'Yes, Logout',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (confirmed) {
      this._authService.logout();
      this.isLoggedIn = false;
      this.cartService.clearCart();
      this._cdr.detectChanges();
    }
  }
}
