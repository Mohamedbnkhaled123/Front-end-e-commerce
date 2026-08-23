import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { env } from '../../../env/env';
import { IOrder, IShippingAddress } from '../models/order.model';
import { AuthService } from './auth-service';

export type { IOrder, IShippingAddress };

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiURL = env.apiURL + 'order';
  private adminOrdersCache$: Observable<{ status: string; data: IOrder[] }> | null = null;
  private myOrdersCache$: Observable<{ status: string; data: IOrder[] }> | null = null;

  constructor(
    private _http: HttpClient,
    private _authService: AuthService
  ) {
    // Automatically clear user-specific order cache on logout / auth identity change
    this._authService.isLogedIn().subscribe(() => {
      this.clearUserCache();
    });
  }

  public clearUserCache(): void {
    this.myOrdersCache$ = null;
  }

  public clearAdminCache(): void {
    this.adminOrdersCache$ = null;
  }

  public clearAllCache(): void {
    this.clearUserCache();
    this.clearAdminCache();
  }

  // Creates new store order
  createOrder(shippingAddress: IShippingAddress, couponCode?: string) {
    const payload: any = { shippingAddress };
    if (couponCode) {
      payload.couponCode = couponCode;
      payload.coupon = couponCode;
      payload.code = couponCode;
    }
    return this._http.post<{ status: string; message: string; data: IOrder }>(
      this.apiURL, 
      payload
    ).pipe(
      tap(() => this.clearAllCache())
    );
  }

  // Fetches user order history (cached in-memory per user session)
  getMyOrders(): Observable<{ status: string; data: IOrder[] }> {
    if (this.myOrdersCache$) {
      return this.myOrdersCache$;
    }

    this.myOrdersCache$ = this._http.get<{ status: string; data: IOrder[] }>(
      `${this.apiURL}/my-orders`
    ).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        this.myOrdersCache$ = null;
        return throwError(() => err);
      })
    );

    return this.myOrdersCache$;
  }

  // Fetches all store orders (cached in-memory for Admin session)
  getAllOrders(): Observable<{ status: string; data: IOrder[] }> {
    if (this.adminOrdersCache$) {
      return this.adminOrdersCache$;
    }

    this.adminOrdersCache$ = this._http.get<{ status: string; data: IOrder[] }>(
      `${this.apiURL}/admin/all`
    ).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        this.adminOrdersCache$ = null;
        return throwError(() => err);
      })
    );

    return this.adminOrdersCache$;
  }

  // Updates order status dynamically (and sends fixed items to bypass backend validation for old orders)
  updateOrderStatus(orderId: string, status: string, items?: any[]) {
    const payload: any = { status };
    if (items) {
      payload.items = items;
    }
    return this._http.patch<{ status: string; message: string; data: IOrder }>(
      `${this.apiURL}/${orderId}/status`,
      payload
    ).pipe(
      tap(() => this.clearAllCache())
    );
  }
}


