import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminHeader } from './shared/admin-header/admin-header.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, AdminHeader, ConfirmModalComponent],
  templateUrl: './dashboard.html'
})
export class Dashboard {}
