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
}
