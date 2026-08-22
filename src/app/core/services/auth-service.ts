import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, ReplaySubject, map, catchError, of } from 'rxjs';
import { env } from '../../../env/env';
import { IAuthLogin, IAuthLoginRes, IAuthRegister, IJWT } from '../models/auth.model';
import { RefreshCoordinator } from './refresh-coordinator';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthanticate = new BehaviorSubject<string | null>(null);
  apiURL = env.apiURL + 'auth/login';

  /** In-memory access token — NEVER persisted to localStorage */
  private accessToken: string | null = null;

  /** Emits true once the initial auth check completes (logged in or guest) */
  authReady$ = new ReplaySubject<boolean>(1);

  /** Handle for the proactive exp-based refresh timer */
  private expTimerHandle: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private _http: HttpClient,
    private _router: Router,
    private _refreshCoordinator: RefreshCoordinator
  ) {}

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

  // Initializes authentication state — called from App.ngOnInit()
  // Non-blocking: fires background refresh, does NOT delay rendering
  onInitAuth() {
    // Clean up legacy localStorage token (forced re-login per plan §3.6)
    const legacyToken = localStorage.getItem('token');
    if (legacyToken) {
      localStorage.removeItem('token');
    }

    // Attempt silent refresh via HttpOnly cookie (non-blocking)
    this._refreshCoordinator.refresh().subscribe({
      next: (token) => {
        if (token) {
          this.setAccessTokenInMemory(token);
          const decoded = this.jwtDecoding(token);
          if (decoded) {
            this.isAuthanticate.next(decoded.name || decoded.id || 'Logged User');
          }
        }
        this.authReady$.next(true);
      },
      error: () => {
        this.accessToken = null;
        this.authReady$.next(true); // Ready as guest
      }
    });
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

    return this._http.post<IAuthLoginRes>(this.apiURL, payload, { withCredentials: true }).pipe(
      map(res => {
        const token = res.accessToken || res.JWT;
        if (token) {
          this.setAccessTokenInMemory(token);
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
    return this._http.post<IAuthLoginRes>(this.apiURL, data, { withCredentials: true }).pipe(
      map(res => {
        const token = res.accessToken || res.JWT;
        const decodedToken = this.jwtDecoding(token);
        const role = (decodedToken?.role || '').toLowerCase();

        if (role === 'admin' || role === 'superadmin') {
          this.setAccessTokenInMemory(token);
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
    return this._http.post<IAuthLoginRes>(`${env.apiURL}user/setup-superadmin`, data, { withCredentials: true }).pipe(
      map(res => {
        const token = res.accessToken || res.JWT;
        if (token) {
          this.setAccessTokenInMemory(token);
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

  /** Returns the in-memory access token (null if absent or expired) */
  getToken(): string | null {
    if (!this.accessToken) return null;
    const decoded = this.jwtDecoding(this.accessToken);
    if (!decoded) {
      this.accessToken = null;
      return null;
    }
    return this.accessToken;
  }

  /** Stores access token in memory and schedules proactive refresh */
  setAccessTokenInMemory(token: string) {
    this.accessToken = token;
    this.scheduleExpRefresh(token);
  }

  clearTokenWithoutRedirect() {
    this.accessToken = null;
    this.cancelExpTimer();
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
    // Cancel proactive refresh timer
    this.cancelExpTimer();

    // Tell backend to revoke the refresh token family
    this._http.post(`${env.apiURL}auth/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(null))
    ).subscribe();

    // Clear in-memory state
    this.accessToken = null;
    this.isAuthanticate.next(null);

    this._router.navigate(['/home']);
  }

  /**
   * Schedules a proactive refresh ~60 seconds before the access token expires.
   * Replaces any existing timer to prevent duplicates.
   */
  private scheduleExpRefresh(token: string): void {
    this.cancelExpTimer();

    const decoded = this.jwtDecoding(token);
    if (!decoded || !decoded.exp) return;

    const nowSec = Math.floor(Date.now() / 1000);
    const secondsUntilExpiry = decoded.exp - nowSec;
    // Refresh 60 seconds before expiry, but at least 10 seconds from now
    const refreshInSeconds = Math.max(secondsUntilExpiry - 60, 10);

    this.expTimerHandle = setTimeout(() => {
      this._refreshCoordinator.refresh().subscribe({
        next: (newToken) => {
          if (newToken) {
            this.setAccessTokenInMemory(newToken);
            const dec = this.jwtDecoding(newToken);
            if (dec) {
              this.isAuthanticate.next(dec.name || dec.id || 'Logged User');
            }
          } else {
            // Refresh failed — token expired, user becomes guest
            this.clearTokenWithoutRedirect();
          }
        }
      });
    }, refreshInSeconds * 1000);
  }

  private cancelExpTimer(): void {
    if (this.expTimerHandle !== null) {
      clearTimeout(this.expTimerHandle);
      this.expTimerHandle = null;
    }
  }
}
