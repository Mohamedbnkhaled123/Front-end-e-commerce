import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, IOrder } from '../../core/services/order.service';
import { ModalService } from '../../core/services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.component.html'
})
export class AdminOrders implements OnInit, OnDestroy {
  orders: IOrder[] = [];
  filteredOrders: IOrder[] = [];
  statusFilter = '';
  isLoading = false;
  message = '';
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
    private _cdr: ChangeDetectorRef
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

  // Updates order status
  onStatusChange(orderId: string, newStatus: string) {
    if (newStatus === 'cancelledByUser') {
      this._modalService.alert({
        title: 'Status Restriction',
        message: 'Sorry, the status "cancelledByUser" can only be set by the customer when they cancel their order.',
        type: 'warning'
      });
      this.loadOrders();
      return;
    }

    const sub = this._orderService.updateOrderStatus(orderId, newStatus).subscribe({
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
