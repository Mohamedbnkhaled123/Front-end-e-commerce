import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IUserListRes } from '../models/user.model';
import { env } from '../../../env/env';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  apiURL = env.apiURL + 'user';

  constructor(private _http: HttpClient, private _authService: AuthService) {}

  // Fetches user list
  getUsers() {
    return this._http.get<IUserListRes>(this.apiURL);
  }

  // Creates admin user account
  createAdmin(payload: any) {
    return this._http.post(`${this.apiURL}/admin`, payload);
  }
}
