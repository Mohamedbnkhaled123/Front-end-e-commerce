import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, map } from 'rxjs';
import { env } from '../../../env/env';
import { IAuthLogin, IAuthLoginRes, IAuthRegister, IJWT } from '../models/auth.model';


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

  isSuperAdmin(): boolean {
    return this.isUser() === 'superadmin';
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
    const guestCartRaw = localStorage.getItem('shopro_guest_cart') || localStorage.getItem('velora_guest_cart');
    let localCart: any[] | undefined = undefined;
    if (guestCartRaw) {
      try {
        const parsed = JSON.parse(guestCartRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localCart = parsed;
        }
      } catch {}
    }

    const payload = {
      ...data,
      localCart
    };

    return this._http.post<IAuthLoginRes>(this.apiURL, payload).pipe(
      map(res => {
        const token = res.JWT;
        if (token) {
          this.storeToken(token);
          if (localCart) {
            localStorage.removeItem('shopro_guest_cart');
            localStorage.removeItem('velora_guest_cart');
          }
        }
        const decodedToken = this.jwtDecoding(token);
        const role = (decodedToken?.role || '').toLowerCase();

        this.setUserLogin(decodedToken?.name || decodedToken?.id || 'User');
        if (role === 'admin' || role === 'superadmin') {
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

        if (role === 'admin' || role === 'superadmin') {
          this.storeToken(token);
          this.setUserLogin(decodedToken?.name || decodedToken?.id || (role === 'superadmin' ? 'Super Admin' : 'Admin'));
          this._router.navigate(['/admin/home']);
        }
        return role;
      })
    );
  }

  // Checks if Super Admin account has been claimed
  checkSuperAdminStatus() {
    return this._http.get<{ status: string; exists: boolean }>(`${env.apiURL}user/superadmin-status`);
  }

  // First-time Super Admin account claim
  setupSuperAdmin(data: any) {
    return this._http.post<IAuthLoginRes>(`${env.apiURL}user/setup-superadmin`, data).pipe(
      map(res => {
        const token = res.JWT;
        if (token) {
          this.storeToken(token);
          const decoded = this.jwtDecoding(token);
          this.setUserLogin(decoded?.name || 'Super Admin');
          this._router.navigate(['/admin/analytics']);
        }
        return res;
      })
    );
  }

  setUserLogin(name: string) {
    this.isAuthanticate.next(name);
  }

  // Decodes JWT token payload
  jwtDecoding(token: string): IJWT | null {
    if (!token || token === 'undefined' || token === 'null') return null;
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
          return null;
        }
      }
      return payload;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.token_key);
    if (!token || token === 'undefined' || token === 'null') {
      localStorage.removeItem(this.token_key);
      return null;
    }
    const decoded = this.jwtDecoding(token);
    if (!decoded) {
      localStorage.removeItem(this.token_key);
      return null;
    }
    return token;
  }

  storeToken(token: string) {
    localStorage.setItem(this.token_key, token);
  }

  clearTokenWithoutRedirect() {
    localStorage.removeItem(this.token_key);
    this.isAuthanticate.next(null);
  }

  // Validates password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 digit)
  validatePasswordStrength(password: string): boolean {
    if (!password || typeof password !== 'string') return false;
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasMinLength && hasUpper && hasLower && hasNumber;
  }

  // Step 1: Requests OTP reset code by email
  forgotPassword(email: string) {
    return this._http.post<{ status: string; message: string; devOtp?: string }>(
      `${env.apiURL}auth/forgot-password`,
      { email }
    );
  }

  // Step 2: Verifies OTP code and updates password
  resetPassword(data: { email: string; otp: string; newPassword: string }) {
    return this._http.post<{ status: string; message: string }>(
      `${env.apiURL}auth/reset-password`,
      data
    );
  }

  // Registers new customer account
  register(data: IAuthRegister) {
    return this._http.post<{ status: string; message?: string }>(`${env.apiURL}auth/register`, data);
  }

  logout() {
    this.clearTokenWithoutRedirect();
    this._router.navigate(['/home']);
  }
}

