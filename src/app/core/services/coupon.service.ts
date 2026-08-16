import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from '../../../env/env';
import { ICoupon, ICouponListRes, ICouponValidateRes } from '../models/coupon.model';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private apiURL = env.apiURL + 'coupon';

  constructor(private _http: HttpClient) {}

  getAllCoupons(): Observable<ICouponListRes> {
    return this._http.get<ICouponListRes>(this.apiURL);
  }

  createCoupon(payload: Partial<ICoupon>): Observable<{ status: string; message: string; data: ICoupon }> {
    return this._http.post<{ status: string; message: string; data: ICoupon }>(this.apiURL, payload);
  }

  toggleCouponStatus(id: string): Observable<{ status: string; message: string; data: ICoupon }> {
    return this._http.patch<{ status: string; message: string; data: ICoupon }>(`${this.apiURL}/${id}/status`, {});
  }

  deleteCoupon(id: string): Observable<{ status: string; message: string }> {
    return this._http.delete<{ status: string; message: string }>(`${this.apiURL}/${id}`);
  }

  validateCoupon(code: string, orderSubtotal: number): Observable<ICouponValidateRes> {
    return this._http.post<ICouponValidateRes>(`${this.apiURL}/validate`, { code, orderSubtotal });
  }

  private readonly ORDER_COUPONS_KEY = 'velora_order_coupons';

  saveOrderCoupon(orderId: string, coupon: { code: string; discountPercent: number; discountAmount: number }) {
    if (!orderId || !coupon) return;
    try {
      const existing = this.getAllOrderCoupons();
      existing[orderId] = coupon;
      localStorage.setItem(this.ORDER_COUPONS_KEY, JSON.stringify(existing));
    } catch {}
  }

  getAllOrderCoupons(): Record<string, { code: string; discountPercent: number; discountAmount: number }> {
    try {
      const raw = localStorage.getItem(this.ORDER_COUPONS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  getOrderCoupon(orderId: string): { code: string; discountPercent: number; discountAmount: number } | null {
    if (!orderId) return null;
    const all = this.getAllOrderCoupons();
    return all[orderId] || null;
  }
}
