import { LocalizeFieldPipe } from '../../core/pipes/localize-field.pipe';
import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, IOrder } from '../../core/services/order.service';
import { ModalService } from '../../core/services/modal.service';
import { Subscription } from 'rxjs';
import { env } from '../../../env/env';

import { CouponService } from '../../core/services/coupon.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LocalizeFieldPipe],
  templateUrl: './admin-orders.component.html'
})
export class AdminOrders implements OnInit, OnDestroy {
  orders = signal<IOrder[]>([]);
  statusFilter = signal<string>('');
  
  filteredOrders = computed(() => {
    const filter = this.statusFilter();
    const all = this.orders();
    if (filter) {
      return all.filter(o => o.orderStatus === filter);
    }
    return all;
  });

  isLoading = signal<boolean>(false);
  message = signal<string>('');
  staticURL = env.staticURL;
  private subscriptions = new Subscription();

  availableStatuses = [
    'pending',
    'prepared',
    'shipped',
    'received',
    'rejected',
    'cancelledByAdmin',
    'cancelledByUser'
  ];

  adminSelectableStatuses = [
    'pending',
    'prepared',
    'shipped',
    'received',
    'rejected',
    'cancelledByAdmin'
  ];

  constructor(
    private _orderService: OrderService,
    private _couponService: CouponService,
    private _modalService: ModalService,
    public _langService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  // Fetches all store orders
  loadOrders() {
    this.isLoading.set(true);

    const sub = this._orderService.getAllOrders().subscribe({
      next: (res) => {
        this.orders.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  // Computes the actual items subtotal from ordered items
  getItemsSubtotal(order: IOrder): number {
    if (!order?.items || order.items.length === 0) return 0;
    return order.items.reduce((sum, item) => {
      const p = item.discountedPrice !== undefined ? item.discountedPrice : item.priceAtPurchase;
      return sum + ((p || 0) * (item.quantity || 1));
    }, 0);
  }

  // Computes actual coupon discount without mixing with product-level discounts
  getCouponDiscount(order: IOrder): number {
    const coupon = this.getOrderCoupon(order);
    if (coupon && coupon.discountAmount > 0) return coupon.discountAmount;
    if (order.couponDiscount && order.couponDiscount > 0) return order.couponDiscount;
    const subtotal = this.getItemsSubtotal(order);
    const shipping = order.shippingFee !== undefined ? order.shippingFee : 50;
    const diff = subtotal + shipping - order.totalPrice;
    return diff > 0.01 ? Number(diff.toFixed(2)) : 0;
  }

  getOrderCoupon(order: IOrder): { code: string; discountPercent: number; discountAmount: number } | null {
    return this._couponService.extractOrderCoupon(order);
  }

  getEffectiveTotal(order: IOrder): number {
    const couponDiscount = this.getCouponDiscount(order);
    if (couponDiscount > 0) {
      const subtotal = this.getItemsSubtotal(order);
      const shipping = order.shippingFee !== undefined ? order.shippingFee : 50;
      return Math.max(0, Number((subtotal + shipping - couponDiscount).toFixed(2)));
    }
    return order.totalPrice;
  }

  // Formats status strings to clean human readable title case
  formatStatus(status: string): string {
    if (!status) return '';
    // Outputting translation keys which will be handled by the pipe
    const map: Record<string, string> = {
      'pending': 'admin.status_pending',
      'prepared': 'admin.status_prepared',
      'shipped': 'admin.status_shipped',
      'received': 'admin.status_received',
      'rejected': 'admin.status_rejected',
      'cancelledByUser': 'admin.status_cancelled_user',
      'cancelledByAdmin': 'admin.status_cancelled_admin'
    };
    return map[status] || status;
  }

  // Updates order status with confirmation guard and rollback
  async onStatusChange(order: IOrder, selectEl: HTMLSelectElement) {
    const currentStatus = order.orderStatus;
    const newStatus = selectEl.value;

    if (newStatus === currentStatus) return;

    if (newStatus === 'cancelledByUser') {
      this._modalService.alert({
        title: 'Status Restriction',
        message: 'Sorry, the status "Cancelled by user" can only be set by the customer when they cancel their order.',
        type: 'warning'
      });
      selectEl.value = currentStatus;
      return;
    }

    let confirmTitle = 'Confirm Order Status Change';
    let confirmMessage = `Are you sure you want to update order #${order._id.slice(-8)} status from "${this.formatStatus(currentStatus)}" to "${this.formatStatus(newStatus)}"?`;
    let confirmBtnText = 'Update Status';

    if (currentStatus === 'cancelledByAdmin') {
      confirmTitle = 'Confirm Reversing Order Cancellation';
      confirmMessage = `This order was previously cancelled by admin. Are you sure you want to reverse the cancellation and update order #${order._id.slice(-8)} status to "${this.formatStatus(newStatus)}"?`;
      confirmBtnText = 'Reverse Cancellation & Update';
    }

    const confirmed = await this._modalService.confirm({
      title: confirmTitle,
      message: confirmMessage,
      type: 'warning',
      confirmText: confirmBtnText,
      cancelText: 'Cancel'
    });

    if (!confirmed) {
      selectEl.value = currentStatus;
      return;
    }

    // Fix missing discountedPrice in old orders to bypass backend mongoose validation
    const fixedItems = order.items.map(item => {
      const fixed = { ...item };
      if (fixed.discountedPrice === undefined) {
        fixed.discountedPrice = fixed.priceAtPurchase;
      }
      return fixed;
    });

    const sub = this._orderService.updateOrderStatus(order._id, newStatus, fixedItems).subscribe({
      next: (res) => {
        this.message.set(res.message || `Order status updated to '${newStatus}'`);
        this.loadOrders();
        setTimeout(() => {
          this.message.set('');
        }, 3000);
      },
      error: (err) => {
        selectEl.value = currentStatus;
        this._modalService.alert({
          title: 'Update Failed',
          message: err?.error?.message || 'Failed to update order status.',
          type: 'danger'
        });
      }
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
