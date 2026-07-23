import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ModalService } from '../../../core/services/modal.service';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-header.component.html'
})
export class AdminHeader {
  constructor(
    private _router: Router,
    private _authService: AuthService,
    private _modalService: ModalService
  ) {}

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
