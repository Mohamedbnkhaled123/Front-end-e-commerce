import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { env } from '../../../env/env';
import { Subscription } from 'rxjs';

export interface IUserAccount {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
}

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './users-list.component.html'
})
export class UsersList implements OnInit, OnDestroy {
  users: IUserAccount[] = [];
  isLoading = false;
  private subscriptions = new Subscription();

  constructor(
    private _http: HttpClient,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this._cdr.detectChanges();

    const sub = this._http.get<{ status: string; data: IUserAccount[] }>(`${env.apiURL}user`).subscribe({
      next: (res) => {
        this.users = res.data || [];
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
