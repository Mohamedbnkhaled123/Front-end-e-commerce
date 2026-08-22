import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';
import { ModalService } from '../core/services/modal.service';
import { AuthService } from '../core/services/auth-service';
import { CartService } from '../core/services/cart.service';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from '../shared/footer/footer.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-frontend',
  standalone: true,
  imports: [RouterOutlet, ConfirmModalComponent, HeaderComponent, FooterComponent],
  templateUrl: './frontend.html'
})
export class Frontend implements OnInit, OnDestroy {
  isLoggedIn = false;
  private _authSub?: Subscription;
  private _routerSub?: Subscription;

  constructor(
    private _router: Router, 
    private _authService: AuthService,
    public cartService: CartService,
    private _modalService: ModalService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkLoginStatus();
    this._authSub = this._authService.isLogedIn().subscribe((user) => {
      this.isLoggedIn = !!user;
      this._cdr.detectChanges();
    });
    this._routerSub = this._router.events.subscribe(() => {
      this.checkLoginStatus();
    });
  }

  ngOnDestroy(): void {
    if (this._routerSub) {
      this._routerSub.unsubscribe();
    }
    if (this._authSub) {
      this._authSub.unsubscribe();
    }
  }

  checkLoginStatus(): void {
    const token = this._authService.getToken();
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
