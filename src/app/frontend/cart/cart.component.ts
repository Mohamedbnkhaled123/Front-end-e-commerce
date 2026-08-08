import { LocalizeFieldPipe } from '../../core/pipes/localize-field.pipe';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService, ICartItem } from '../../core/services/cart.service';
import { env } from '../../../env/env';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth-service';
import { ModalService } from '../../core/services/modal.service';

import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, LocalizeFieldPipe],
  templateUrl: './cart.component.html'
})
export class Cart implements OnInit, OnDestroy {
  cartItems: ICartItem[] = [];
  subtotal = 0;
  totalItemsCount = 0;
  hasPriceChanges = false;
  staticURL = env.staticURL;

  readonly FREE_SHIPPING_THRESHOLD = 1000;

  get shippingProgressPercentage(): number {
    if (!this.subtotal) return 0;
    return Math.min(100, Math.round((this.subtotal / this.FREE_SHIPPING_THRESHOLD) * 100));
  }

  get remainingForFreeShipping(): number {
    return Math.max(0, this.FREE_SHIPPING_THRESHOLD - this.subtotal);
  }

  get isFreeShippingUnlocked(): boolean {
    return this.subtotal >= this.FREE_SHIPPING_THRESHOLD;
  }

  private subscriptions = new Subscription();

  constructor(
    private _cartService: CartService,
    private _authService: AuthService,
    private _modalService: ModalService
  ) {}

  ngOnInit(): void {
    // Subscribe to cart items state
    const sub = this._cartService.cartItems$.subscribe({
      next: (items) => {
        this.cartItems = items;
        this.calculateTotals();
      }
    });
    this.subscriptions.add(sub);

    // Refresh cart if logged in
    const token = this._authService.getToken();
    if (token) {
      this._cartService.fetchCartFromDB().subscribe();
    }
  }

  calculateTotals() {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + (item.priceAtAddition * item.quantity), 0);
    this.totalItemsCount = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    this.hasPriceChanges = this.cartItems.some(item => item.isPriceChanged === true);
  }

  async removeItem(productId: string, productName?: string) {
    const confirmed = await this._modalService.confirm({
      title: 'Remove Item',
      message: `Are you sure you want to remove ${productName ? '"' + productName + '"' : 'this item'} from your shopping cart?`,
      confirmText: 'Remove Item',
      cancelText: 'Keep Item',
      type: 'danger'
    });

    if (!confirmed) return;

    const result = this._cartService.removeFromCart(productId);
    if (result) {
      result.subscribe();
    }
  }

  updateQuantity(item: ICartItem, delta: number) {
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      this.removeItem(item.productId, item.name);
      return;
    }

    this._cartService.updateQuantity(item.productId, newQty).subscribe({
      error: (err) => {
        const errorMsg = err?.error?.message || `Only ${item.quantity} item(s) available in stock.`;
        this._modalService.alert({
          title: 'Stock Limit Reached',
          message: errorMsg,
          type: 'warning'
        });
      }
    });
  }


  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
