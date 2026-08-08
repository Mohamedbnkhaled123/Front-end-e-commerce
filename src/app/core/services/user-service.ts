import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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

  constructor(private _http: HttpClient) {}

  // Fetches user list
  getUsers() {
    return this._http.get<IUserListRes>(this.apiURL);
  }

  // Creates admin user account
  createAdmin(payload: ICreateAdminPayload) {
    return this._http.post<{ status: string; message?: string }>(`${this.apiURL}/admin`, payload);
  }

  // Toggles user account active/disabled status
  toggleUserStatus(id: string) {
    return this._http.patch<{ status: string; message: string; data: any }>(`${this.apiURL}/${id}/status`, {});
  }

  // Toggles sub-admin active/disabled status (Super Admin only)
  toggleAdminStatus(id: string) {
    return this._http.patch<{ status: string; message: string; data: any }>(`${this.apiURL}/${id}/admin-status`, {});
  }

  // Deletes sub-admin account (Super Admin only)
  deleteAdmin(id: string) {
    return this._http.delete<{ status: string; message: string }>(`${this.apiURL}/${id}`);
  }
}


