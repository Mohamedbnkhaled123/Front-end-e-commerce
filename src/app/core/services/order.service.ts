import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { env } from '../../../env/env';
import { IOrder, IShippingAddress } from '../models/order.model';

export type { IOrder, IShippingAddress };


@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiURL = env.apiURL + 'order';

  constructor(private _http: HttpClient) {}

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
    );
  }

  // Fetches user order history
  getMyOrders() {
    return this._http.get<{ status: string; data: IOrder[] }>(
      `${this.apiURL}/my-orders`
    );
  }

  // Fetches all store orders
  getAllOrders() {
    return this._http.get<{ status: string; data: IOrder[] }>(
      `${this.apiURL}/admin/all`
    );
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
    );
  }
}


