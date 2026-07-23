import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { env } from '../../../env/env';
import { IProduct } from '../models/product.model';
import { BehaviorSubject, Observable, of, tap, map } from 'rxjs';
import { AuthService } from './auth-service';
import { ModalService } from './modal.service';

export interface ICartItem {
  productId: string;
  name: string;
  priceAtAddition: number;
  quantity: number;
  isPriceChanged?: boolean;
  productImg?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiURL = env.apiURL + 'cart';
  private LOCAL_STORAGE_KEY = 'velora_guest_cart';

  // State using BehaviorSubject & Signal
  cartItems$ = new BehaviorSubject<ICartItem[]>([]);
  cartCount = signal<number>(0);

  constructor(
    private _http: HttpClient,
    private _authService: AuthService,
    private _modalService: ModalService
  ) {
    this.initCart();
  }

  // Initializes cart based on auth status
  initCart() {
    const token = localStorage.getItem('token');
    if (token) {
      this.fetchCartFromDB().subscribe();
    } else {
      this.loadCartFromLocalStorage();
    }
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private loadCartFromLocalStorage() {
    const raw = localStorage.getItem(this.LOCAL_STORAGE_KEY);
    const items: ICartItem[] = raw ? JSON.parse(raw) : [];
    this.cartItems$.next(items);
    this.updateCartCount(items);
  }

  private saveCartToLocalStorage(items: ICartItem[]) {
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(items));
    this.cartItems$.next(items);
    this.updateCartCount(items);
  }

  private updateCartCount(items: ICartItem[]) {
    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    this.cartCount.set(total);
  }

  // Adds product item to cart
  addToCart(product: IProduct, quantity: number = 1): Observable<boolean> {
    const token = localStorage.getItem('token');

    if (token) {
      if (this._authService.isUser() === 'admin') {
        this._modalService.alert({
          title: 'Action Restrained',
          message: 'Admins are not allowed to add products to the cart or place orders.',
          type: 'warning'
        });
        return of(false);
      }

      const payload = {
        productId: product._id,
        quantity
      };
      return this._http.post<{ status: string; data: any[] }>(this.apiURL, payload, { headers: this.getHeaders() }).pipe(
        tap((res) => {
          const formatted: ICartItem[] = (res.data || []).map(item => ({
            productId: item.productId?._id || item.productId,
            name: item.productId?.name || item.name || product.name,
            priceAtAddition: item.priceAtAddition,
            quantity: item.quantity,
            isPriceChanged: item.isPriceChanged,
            productImg: item.productId?.imgURL || product.imgURL
          }));
          this.cartItems$.next(formatted);
          this.updateCartCount(formatted);
        }),
        map(() => true)
      );
    } else {
      const currentItems = [...this.cartItems$.value];
      const existingIndex = currentItems.findIndex(i => i.productId === product._id);

      if (existingIndex > -1) {
        currentItems[existingIndex].quantity += quantity;
        currentItems[existingIndex].priceAtAddition = product.price;
        if (product.imgURL) currentItems[existingIndex].productImg = product.imgURL;
      } else {
        currentItems.push({
          productId: product._id,
          name: product.name,
          priceAtAddition: product.price,
          quantity: quantity,
          productImg: product.imgURL,
          isPriceChanged: false
        });
      }

      this.saveCartToLocalStorage(currentItems);
      return of(true);
    }
  }

  // Fetches cart from database
  fetchCartFromDB() {
    return this._http.get<{ status: string; data: any[] }>(this.apiURL, { headers: this.getHeaders() }).pipe(
      tap((res) => {
        const formatted: ICartItem[] = (res.data || []).map(item => ({
          productId: item.productId?._id || item.productId,
          name: item.productId?.name || item.name,
          priceAtAddition: item.priceAtAddition,
          quantity: item.quantity,
          isPriceChanged: item.isPriceChanged,
          productImg: item.productId?.imgURL
        }));
        this.cartItems$.next(formatted);
        this.updateCartCount(formatted);
      })
    );
  }

  // Syncs local cart to database
  syncCartOnLogin() {
    const raw = localStorage.getItem(this.LOCAL_STORAGE_KEY);
    if (!raw) return;

    const guestItems: ICartItem[] = JSON.parse(raw);
    if (guestItems.length === 0) return;

    guestItems.forEach(item => {
      this._http.post(this.apiURL, {
        productId: item.productId,
        quantity: item.quantity
      }, { headers: this.getHeaders() }).subscribe({
        next: () => {
          this.fetchCartFromDB().subscribe();
        }
      });
    });

    localStorage.removeItem(this.LOCAL_STORAGE_KEY);
  }

  // Removes item from cart
  removeFromCart(productId: string) {
    const token = localStorage.getItem('token');
    if (token) {
      return this._http.delete<{ status: string; data: any[] }>(`${this.apiURL}/${productId}`, { headers: this.getHeaders() }).pipe(
        tap((res) => {
          const formatted: ICartItem[] = (res.data || []).map(item => ({
            productId: item.productId?._id || item.productId,
            name: item.productId?.name || item.name,
            priceAtAddition: item.priceAtAddition,
            quantity: item.quantity,
            isPriceChanged: item.isPriceChanged,
            productImg: item.productId?.imgURL
          }));
          this.cartItems$.next(formatted);
          this.updateCartCount(formatted);
        })
      );
    } else {
      const current = this.cartItems$.value.filter(i => i.productId !== productId);
      this.saveCartToLocalStorage(current);
      return undefined;
    }
  }

  // Clears all cart items
  clearCart() {
    localStorage.removeItem(this.LOCAL_STORAGE_KEY);
    this.cartItems$.next([]);
    this.cartCount.set(0);
  }
}
