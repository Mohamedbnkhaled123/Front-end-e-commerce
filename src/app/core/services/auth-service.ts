import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, map } from 'rxjs';
import { env } from '../../../env/env';
import { IAuthLogin, IAuthLoginRes, IJWT } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthanticate = new BehaviorSubject<string | null>(null);
  apiURL = env.apiURL + 'auth/login';
  private token_key = 'token';

  constructor(private _http: HttpClient, private _router: Router) {}

  // Checks current user role
  isUser(): string | null {
    const token = this.getToken();
    if (token) {
      const decoded = this.jwtDecoding(token);
      if (decoded) {
        return (decoded.role || '').toLowerCase();
      }
    }
    return null;
  }

  // Observable for auth status
  isLogedIn() {
    return this.isAuthanticate.asObservable();
  }

  // Initializes authentication state
  onInitAuth() {
    const token = this.getToken();
    if (token) {
      const decoded = this.jwtDecoding(token);
      if (decoded) {
        return this.isAuthanticate.next(decoded.name || decoded.id || 'Logged User');
      }
    }
    this.isAuthanticate.next(null);
  }

  // Customer login handler
  login(data: IAuthLogin) {
    return this._http.post<IAuthLoginRes>(this.apiURL, data).pipe(
      map(res => {
        const token = res.JWT;
        this.storeToken(token);
        const decodedToken = this.jwtDecoding(token);
        const role = (decodedToken?.role || '').toLowerCase();

        this.setUserLogin(decodedToken?.name || decodedToken?.id || 'User');
        if (role === 'admin') {
          this._router.navigate(['/admin/home']);
        } else {
          this._router.navigate(['/home']);
        }
        return role;
      })
    );
  }

  // Admin dashboard login handler
  adminLogin(data: IAuthLogin) {
    return this._http.post<IAuthLoginRes>(this.apiURL, data).pipe(
      map(res => {
        const token = res.JWT;
        const decodedToken = this.jwtDecoding(token);
        const role = (decodedToken?.role || '').toLowerCase();

        if (role === 'admin') {
          this.storeToken(token);
          this.setUserLogin(decodedToken?.name || decodedToken?.id || 'Admin');
          this._router.navigate(['/admin/home']);
        }
        return role;
      })
    );
  }

  setUserLogin(name: string) {
    this.isAuthanticate.next(name);
  }

  // Decodes JWT token payload
  jwtDecoding(token: string): IJWT | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      ));

      if (payload && payload.exp) {
        const isExpired = Math.floor(Date.now() / 1000) >= payload.exp;
        if (isExpired) {
          this.logout();
          return null;
        }
      }
      return payload;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.token_key);
  }

  storeToken(token: string) {
    localStorage.setItem(this.token_key, token);
  }

  clearTokenWithoutRedirect() {
    localStorage.removeItem(this.token_key);
    this.isAuthanticate.next(null);
  }

  // Resets password by email
  resetPassword(data: { email: string; newPassword: string }) {
    return this._http.post<{ status: string; message: string }>(env.apiURL + 'auth/forgot-password', data);
  }

  logout() {
    this.clearTokenWithoutRedirect();
    this._router.navigate(['/home']);
  }
}
