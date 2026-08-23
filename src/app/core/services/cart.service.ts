import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { env } from '../../../env/env';
import { IProduct } from '../models/product.model';
import { ICartItem, ICartItemRaw } from '../models/cart.model';
import { BehaviorSubject, Observable, of, tap, map, from, concatMap, finalize, distinctUntilChanged } from 'rxjs';
import { AuthService } from './auth-service';
import { ModalService } from './modal.service';
import { ToastService } from './toast.service';

export type { ICartItem, ICartItemRaw };

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiURL = env.apiURL + 'cart';
  private LOCAL_STORAGE_KEY = 'shopro_guest_cart';

  // State using BehaviorSubject & Signal
  cartItems$ = new BehaviorSubject<ICartItem[]>([]);
  cartCount = signal<number>(0);

  constructor(
    private _http: HttpClient,
    private _authService: AuthService,
    private _modalService: ModalService,
    private _toastService: ToastService
  ) {
    this._authService.isLogedIn().pipe(
      map(() => ({ token: this._authService.getToken(), role: this._authService.isUser() })),
      distinctUntilChanged((a, b) => a.token === b.token && a.role === b.role)
    ).subscribe(({ token, role }) => {
      if (token) {
        if (role === 'admin' || role === 'superadmin') {
          // Admin / SuperAdmin accounts must NEVER possess cart items or inherit guest carts
          this.clearCart();
        } else {
          // Normal customer, fetch synced cart from DB
          this.fetchCartFromDB().subscribe({ error: () => {} });
        }
      } else {
        // Guest or logged out
        this.loadCartFromLocalStorage();
      }
    });
  }

  private isAdminOrSuperAdmin(): boolean {
    const role = this._authService.isUser();
    return role === 'admin' || role === 'superadmin';
  }

  private formatCartItems(data: ICartItemRaw[], defaultProduct?: IProduct): ICartItem[] {
    return (data || []).map(item => {
      const prodObj = (item.productId && typeof item.productId === 'object') ? item.productId : undefined;
      const prodIdStr = typeof item.productId === 'string' 
        ? item.productId 
        : (prodObj?._id ? String(prodObj._id) : (item.productId ? String(item.productId) : ''));

      // Calculate effective discounted price if product has a discount
      const prodDiscount = (prodObj as any)?.discount ?? defaultProduct?.discount ?? item.discountPercent ?? 0;
      const rawPrice = (prodObj as any)?.price ?? defaultProduct?.price ?? item.priceAtAddition;
      
      let effectivePrice = item.priceAtAddition;
      if (prodDiscount > 0 && rawPrice) {
        effectivePrice = Number((rawPrice * (1 - prodDiscount / 100)).toFixed(2));
      } else if (rawPrice !== undefined && rawPrice !== null) {
        effectivePrice = rawPrice;
      }

      return {
        productId: prodIdStr,
        name: prodObj?.name || item.name || defaultProduct?.name || 'Product Item',
        priceAtAddition: effectivePrice,
        originalPrice: (rawPrice && prodDiscount > 0) ? rawPrice : undefined,
        discountPercent: prodDiscount > 0 ? prodDiscount : undefined,
        quantity: item.quantity,
        isPriceChanged: item.isPriceChanged,
        productImg: prodObj?.imgURL || defaultProduct?.imgURL
      };
    });
  }

  private loadCartFromLocalStorage() {
    if (this.isAdminOrSuperAdmin()) {
      this.clearCart();
      return;
    }
    const raw = localStorage.getItem(this.LOCAL_STORAGE_KEY);
    const items: ICartItem[] = raw ? JSON.parse(raw) : [];
    this.cartItems$.next(items);
    this.updateCartCount(items);
  }

  private saveCartToLocalStorage(items: ICartItem[]) {
    if (this.isAdminOrSuperAdmin()) {
      this.clearCart();
      return;
    }
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(items));
    this.cartItems$.next(items);
    this.updateCartCount(items);
  }

  private updateCartCount(items: ICartItem[]) {
    if (this.isAdminOrSuperAdmin()) {
      this.cartCount.set(0);
      return;
    }
    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    this.cartCount.set(total);
  }

  // Adds product item to cart
  addToCart(product: IProduct, quantity: number = 1): Observable<boolean> {
    if (this.isAdminOrSuperAdmin()) {
      this._modalService.alert({
        title: 'Action Restrained',
        message: 'Admins and Super Admins are not allowed to add products to the cart or place orders.',
        type: 'warning'
      });
      return of(false);
    }

    const token = this._authService.getToken();

    if (token) {
      const payload = {
        productId: product._id,
        quantity
      };
      return this._http.post<{ status: string; data: ICartItemRaw[] }>(this.apiURL, payload).pipe(
        tap((res) => {
          const formatted = this.formatCartItems(res.data, product);
          this.cartItems$.next(formatted);
          this.updateCartCount(formatted);
          this._toastService.show(`Added "${product.name}" to your cart!`, 'success');
        }),
        map(() => true)
      );
    } else {
      const currentItems = [...this.cartItems$.value];
      const existingIndex = currentItems.findIndex(i => i.productId === product._id);

      const effectivePrice = (product.discount && product.discount > 0)
        ? Number((product.price * (1 - product.discount / 100)).toFixed(2))
        : product.price;

      if (existingIndex > -1) {
        currentItems[existingIndex].quantity += quantity;
        currentItems[existingIndex].priceAtAddition = effectivePrice;
        if (product.imgURL) currentItems[existingIndex].productImg = product.imgURL;
      } else {
        currentItems.push({
          productId: product._id,
          name: product.name,
          priceAtAddition: effectivePrice,
          quantity: quantity,
          productImg: product.imgURL,
          isPriceChanged: false
        });
      }

      this.saveCartToLocalStorage(currentItems);
      this._toastService.show(`Added "${product.name}" to your cart!`, 'success');
      return of(true);
    }
  }

  // Updates quantity of a specific cart item atomically (Independent Product Update)
  updateQuantity(productId: string, newQuantity: number): Observable<boolean> {
    if (this.isAdminOrSuperAdmin()) {
      return of(false);
    }

    const token = this._authService.getToken();

    if (token) {
      return this._http.patch<{ status: string; data: ICartItemRaw[] }>(`${this.apiURL}/${productId}`, {
        quantity: newQuantity
      }).pipe(
        tap((res) => {
          const formatted = this.formatCartItems(res.data);
          this.cartItems$.next(formatted);
          this.updateCartCount(formatted);
        }),
        map(() => true)
      );
    } else {
      const currentItems = [...this.cartItems$.value];
      const index = currentItems.findIndex(i => i.productId === productId);
      if (index > -1) {
        currentItems[index].quantity = newQuantity;
        this.saveCartToLocalStorage(currentItems);
      }
      return of(true);
    }
  }

  // Fetches cart from database
  fetchCartFromDB() {
    if (this.isAdminOrSuperAdmin()) {
      this.cartItems$.next([]);
      this.cartCount.set(0);
      return of({ status: 'success', data: [] as ICartItemRaw[] });
    }

    return this._http.get<{ status: string; data: ICartItemRaw[] }>(this.apiURL).pipe(
      tap((res) => {
        if (this.isAdminOrSuperAdmin()) {
          this.cartItems$.next([]);
          this.cartCount.set(0);
          return;
        }
        const formatted = this.formatCartItems(res.data);
        this.cartItems$.next(formatted);
        this.updateCartCount(formatted);
      })
    );
  }

  // Syncs local guest cart to database sequentially
  syncCartOnLogin() {
    if (this.isAdminOrSuperAdmin()) {
      this.clearCart();
      return;
    }

    const raw = localStorage.getItem(this.LOCAL_STORAGE_KEY);
    if (!raw) return;

    const guestItems: ICartItem[] = JSON.parse(raw);
    if (guestItems.length === 0) return;

    from(guestItems).pipe(
      concatMap((item) =>
        this._http.post(this.apiURL, {
          productId: item.productId,
          quantity: item.quantity
        })
      ),
      finalize(() => {
        localStorage.removeItem(this.LOCAL_STORAGE_KEY);
        this.fetchCartFromDB().subscribe();
      })
    ).subscribe();
  }

  // Removes item from cart
  removeFromCart(productId: string) {
    if (this.isAdminOrSuperAdmin()) {
      return undefined;
    }

    const token = this._authService.getToken();
    if (token) {
      return this._http.delete<{ status: string; data: ICartItemRaw[] }>(`${this.apiURL}/${productId}`).pipe(
        tap((res) => {
          const formatted = this.formatCartItems(res.data);
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
    localStorage.removeItem('velora_guest_cart');
    this.cartItems$.next([]);
    this.cartCount.set(0);
  }
}
