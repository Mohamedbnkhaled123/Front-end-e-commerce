import { LocalizeFieldPipe } from '../../core/pipes/localize-field.pipe';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { CartService, ICartItem } from '../../core/services/cart.service';
import { ModalService } from '../../core/services/modal.service';
import { IShippingAddress } from '../../core/models/order.model';
import { env } from '../../../env/env';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth-service';

import confetti from 'canvas-confetti';

import { CouponService } from '../../core/services/coupon.service';

import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, LocalizeFieldPipe],
  templateUrl: './checkout.component.html'
})
export class Checkout implements OnInit {
  title = 'Home';
  street = '';
  city = '';
  buildingNumber = '';
  floorNumber = '';
  phoneNumber = '';

  // Promo Coupon State
  couponCode = '';
  lastAppliedCode = '';
  appliedCoupon: { code: string; discountPercent: number; discountAmount: number } | null = null;
  couponMessage = '';
  couponError = '';
  isValidatingCoupon = false;

  get isPhoneValid(): boolean {
    const cleanPhone = (this.phoneNumber || '').trim();
    return cleanPhone.length >= 8 && /^[0-9+\s\-()]+$/.test(cleanPhone);
  }

  get isStreetValid(): boolean {
    return (this.street || '').trim().length >= 3;
  }

  get isCityValid(): boolean {
    return (this.city || '').trim().length >= 2;
  }

  cartItems: ICartItem[] = [];
  subtotal = 0;
  totalItemsCount = 0;
  staticURL = env.staticURL;

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  private subscriptions = new Subscription();

  constructor(
    private _orderService: OrderService,
    private _cartService: CartService,
    private _authService: AuthService,
    private _couponService: CouponService,
    private _modalService: ModalService,
    private _router: Router,
    private _cdr: ChangeDetectorRef
  ) {}

  get grandTotal(): number {
    return Math.max(0, this.subtotal - (this.appliedCoupon?.discountAmount || 0));
  }

  get canApplyCoupon(): boolean {
    const code = (this.couponCode || '').trim().toUpperCase();
    if (!code || this.isValidatingCoupon) return false;
    if (this.appliedCoupon && code === this.lastAppliedCode) return false;
    return true;
  }

  applyCoupon() {
    const code = (this.couponCode || '').trim().toUpperCase();
    if (!code) return;
    if (this.appliedCoupon && code === this.lastAppliedCode) return;

    this.isValidatingCoupon = true;
    this.couponError = '';
    this.couponMessage = '';

    this._couponService.validateCoupon(code, this.subtotal).subscribe({
      next: (res) => {
        this.appliedCoupon = {
          code: res.data.code,
          discountPercent: res.data.discountPercent,
          discountAmount: res.data.discountAmount
        };
        this.lastAppliedCode = code;
        this.couponMessage = `Coupon applied! You saved EGP ${res.data.discountAmount.toFixed(2)}.`;
        this.isValidatingCoupon = false;
        this._cdr.detectChanges();
      },
      error: (err) => {
        this.couponError = err?.error?.message || 'Invalid coupon code.';
        this.appliedCoupon = null;
        this.lastAppliedCode = '';
        this.isValidatingCoupon = false;
        this._cdr.detectChanges();
      }
    });
  }

  removeCoupon() {
    this.appliedCoupon = null;
    this.lastAppliedCode = '';
    this.couponCode = '';
    this.couponMessage = '';
    this.couponError = '';
    this._cdr.detectChanges();
  }

  ngOnInit(): void {
    const token = this._authService.getToken();
    if (!token) {
      this._router.navigate(['/login']);
      return;
    }

    const sub = this._cartService.cartItems$.subscribe({
      next: (items) => {
        this.cartItems = items;
        this.subtotal = items.reduce((sum, item) => sum + (item.priceAtAddition * item.quantity), 0);
        this.totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  async onPlaceOrder() {
    this.errorMessage = '';
    this.successMessage = '';

    const cleanStreet = (this.street || '').trim();
    const cleanCity = (this.city || '').trim();
    const cleanPhone = (this.phoneNumber || '').trim();
    const cleanBuilding = (this.buildingNumber || '').trim();
    const cleanFloor = (this.floorNumber || '').trim();

    if (!cleanStreet || !cleanCity || !cleanPhone) {
      this.errorMessage = 'Please complete your shipping address and phone number.';
      this._cdr.detectChanges();
      return;
    }

    const phoneRegex = /^(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,}$/;
    if (cleanPhone.length < 8 || !/^[0-9+\s\-()]+$/.test(cleanPhone)) {
      this.errorMessage = 'Please enter a valid phone number.';
      this._cdr.detectChanges();
      return;
    }

    const confirmed = await this._modalService.confirm({
      title: 'Confirm Purchase',
      message: `Are you sure you want to place this order with delivery to ${cleanCity}, ${cleanStreet}?`,
      confirmText: 'Yes, Place Order',
      cancelText: 'Review Details',
      type: 'info'
    });

    if (!confirmed) return;

    this.isLoading = true;
    this._cdr.detectChanges();

    const shippingAddress: IShippingAddress = {
      title: (this.title || 'Home').trim(),
      street: cleanStreet,
      city: cleanCity,
      buildingNumber: cleanBuilding || undefined,
      floorNumber: cleanFloor || undefined,
      phoneNumber: cleanPhone
    };

    this._orderService.createOrder(shippingAddress, this.appliedCoupon?.code).subscribe({
      next: async () => {
        this.isLoading = false;
        this._cartService.clearCart();
        this._cdr.detectChanges();

        // Trigger celebratory confetti burst
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          try {
            confetti({
              particleCount: 70,
              spread: 80,
              origin: { y: 0.6 }
            });
          } catch {}
        }

        await this._modalService.alert({
          title: 'Order Placed Successfully! 🎉',
          message: 'Thank you for your order! Your purchase has been confirmed and is now being processed.',
          type: 'success'
        });

        this._router.navigate(['/my-orders']);
      },
      error: async (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || '';

        if (msg.includes('ACCOUNT_PURCHASE_RESTRICTED') || msg.includes('restricted from completing purchases')) {
          const contactUs = await this._modalService.confirm({
            title: 'Purchase Access Restricted ⚠️',
            message: 'Your user account is currently restricted from completing purchases on shoPRO. Would you like to contact our support team for assistance?',
            confirmText: 'Contact Support',
            cancelText: 'Close',
            type: 'warning'
          });
          if (contactUs) {
            this._router.navigate(['/contact']);
          }
          this._cdr.detectChanges();
          return;
        }

        this.errorMessage = msg || 'Failed to place order. Please check item stock or login status.';
        this._cdr.detectChanges();
      }
    });
  }
}

