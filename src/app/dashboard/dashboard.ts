import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AdminHeader } from './shared/admin-header/admin-header.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

import { TranslatePipe } from '../core/pipes/translate.pipe';
import { LogoComponent } from '../shared/logo/logo.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AdminHeader, ConfirmModalComponent, TranslatePipe, LogoComponent],
  templateUrl: './dashboard.html'
})
export class Dashboard {}
