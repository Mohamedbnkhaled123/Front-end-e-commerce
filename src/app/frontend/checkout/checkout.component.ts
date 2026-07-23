import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';
import { ModalService } from '../../core/services/modal.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html'
})
export class Checkout implements OnInit {
  title = 'Home';
  street = '';
  city = '';
  phone = '';

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private _orderService: OrderService,
    private _cartService: CartService,
    private _modalService: ModalService,
    private _router: Router,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this._router.navigate(['/login']);
    }
  }

  async onPlaceOrder() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.street || !this.city || !this.phone) {
      this.errorMessage = 'Please complete your shipping address and phone number.';
      this._cdr.detectChanges();
      return;
    }

    const confirmed = await this._modalService.confirm({
      title: 'Confirm Purchase',
      message: `Are you sure you want to place this order with delivery to ${this.city}, ${this.street}?`,
      confirmText: 'Yes, Place Order ️',
      cancelText: 'Review Details',
      type: 'info'
    });

    if (!confirmed) return;

    this.isLoading = true;
    this._cdr.detectChanges();

    const shippingAddress = {
      title: this.title,
      street: this.street,
      city: this.city,
      phone: this.phone
    };

    this._orderService.createOrder(shippingAddress).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Order placed successfully! Redirecting to My Orders...';
        this._cartService.clearCart();
        this._cdr.detectChanges();
        setTimeout(() => {
          this._router.navigate(['/my-orders']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Failed to place order. Please check item stock or login status.';
        this._cdr.detectChanges();
      }
    });
  }
}
