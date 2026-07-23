import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { env } from '../../../env/env';

export interface IOrder {
  _id: string;
  totalPrice: number;
  orderStatus: string;
  items: Array<{
    productId: any;
    quantity: number;
    priceAtPurchase: number;
  }>;
  shippingAddress?: any;
  createdAt?: string;
  user?: any;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiURL = env.apiURL + 'order';

  constructor(private _http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Creates new store order
  createOrder(shippingAddress: any) {
    return this._http.post<{ status: string; message: string; data: IOrder }>(
      this.apiURL, 
      { shippingAddress }, 
      { headers: this.getHeaders() }
    );
  }

  // Fetches user order history
  getMyOrders() {
    return this._http.get<{ status: string; data: IOrder[] }>(
      `${this.apiURL}/my-orders`, 
      { headers: this.getHeaders() }
    );
  }

  // Fetches all store orders
  getAllOrders() {
    return this._http.get<{ status: string; data: IOrder[] }>(
      `${this.apiURL}/admin/all`
    );
  }

  // Updates order status dynamically
  updateOrderStatus(orderId: string, status: string) {
    return this._http.patch<{ status: string; message: string; data: IOrder }>(
      `${this.apiURL}/${orderId}/status`,
      { status },
      { headers: this.getHeaders() }
    );
  }
}
