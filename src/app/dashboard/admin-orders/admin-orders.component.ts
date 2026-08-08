import { LocalizeFieldPipe } from '../../core/pipes/localize-field.pipe';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, IOrder } from '../../core/services/order.service';
import { ModalService } from '../../core/services/modal.service';
import { Subscription } from 'rxjs';
import { env } from '../../../env/env';

import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LocalizeFieldPipe],
  templateUrl: './admin-orders.component.html'
})
export class AdminOrders implements OnInit, OnDestroy {
  orders: IOrder[] = [];
  filteredOrders: IOrder[] = [];
  statusFilter = '';
  isLoading = false;
  message = '';
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
    private _modalService: ModalService,
    private _cdr: ChangeDetectorRef,
    public _langService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  // Fetches all store orders
  loadOrders() {
    this.isLoading = true;
    this._cdr.detectChanges();

    const sub = this._orderService.getAllOrders().subscribe({
      next: (res) => {
        this.orders = res.data || [];
        this.applyFilter();
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  // Filters orders by status
  applyFilter() {
    if (this.statusFilter) {
      this.filteredOrders = this.orders.filter(o => o.orderStatus === this.statusFilter);
    } else {
      this.filteredOrders = [...this.orders];
    }
    this._cdr.detectChanges();
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
      this._cdr.detectChanges();
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
        this.message = res.message || `Order status updated to '${newStatus}'`;
        this.loadOrders();
        this._cdr.detectChanges();
        setTimeout(() => {
          this.message = '';
          this._cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        selectEl.value = currentStatus;
        this._modalService.alert({
          title: 'Update Failed',
          message: err?.error?.message || 'Failed to update order status.',
          type: 'danger'
        });
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
