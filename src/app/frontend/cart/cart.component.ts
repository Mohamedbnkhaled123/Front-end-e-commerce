import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService, ICartItem } from '../../core/services/cart.service';
import { env } from '../../../env/env';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html'
})
export class Cart implements OnInit, OnDestroy {
  cartItems: ICartItem[] = [];
  subtotal = 0;
  totalItemsCount = 0;
  hasPriceChanges = false;
  staticURL = env.staticURL;

  private subscriptions = new Subscription();

  constructor(private _cartService: CartService) {}

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
    const token = localStorage.getItem('token');
    if (token) {
      this._cartService.fetchCartFromDB().subscribe();
    }
  }

  calculateTotals() {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + (item.priceAtAddition * item.quantity), 0);
    this.totalItemsCount = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    this.hasPriceChanges = this.cartItems.some(item => item.isPriceChanged === true);
  }

  removeItem(productId: string) {
    const result = this._cartService.removeFromCart(productId);
    if (result) {
      result.subscribe();
    }
  }

  updateQuantity(item: ICartItem, delta: number) {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;

    item.quantity = newQty;
    this.calculateTotals();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
