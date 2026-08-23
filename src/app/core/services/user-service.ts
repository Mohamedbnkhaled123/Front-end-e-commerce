import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { IUserListRes } from '../models/user.model';
import { env } from '../../../env/env';

export interface ICreateAdminPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  apiURL = env.apiURL + 'user';
  private usersCache$: Observable<IUserListRes> | null = null;

  constructor(private _http: HttpClient) {}

  public clearCache(): void {
    this.usersCache$ = null;
  }

  // Fetches user list (cached in-memory for Admin session)
  getUsers(): Observable<IUserListRes> {
    if (this.usersCache$) {
      return this.usersCache$;
    }

    this.usersCache$ = this._http.get<IUserListRes>(this.apiURL).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        this.usersCache$ = null;
        return throwError(() => err);
      })
    );

    return this.usersCache$;
  }

  // Creates admin user account
  createAdmin(payload: ICreateAdminPayload) {
    return this._http.post<{ status: string; message?: string }>(`${this.apiURL}/admin`, payload).pipe(
      tap(() => this.clearCache())
    );
  }

  // Toggles user account active/disabled status
  toggleUserStatus(id: string) {
    return this._http.patch<{ status: string; message: string; data: any }>(`${this.apiURL}/${id}/status`, {}).pipe(
      tap(() => this.clearCache())
    );
  }

  // Toggles sub-admin active/disabled status (Super Admin only)
  toggleAdminStatus(id: string) {
    return this._http.patch<{ status: string; message: string; data: any }>(`${this.apiURL}/${id}/admin-status`, {}).pipe(
      tap(() => this.clearCache())
    );
  }

  // Deletes sub-admin account (Super Admin only)
  deleteAdmin(id: string) {
    return this._http.delete<{ status: string; message: string }>(`${this.apiURL}/${id}`).pipe(
      tap(() => this.clearCache())
    );
  }
}


