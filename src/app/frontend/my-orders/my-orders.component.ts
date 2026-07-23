import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, IOrder } from '../../core/services/order.service';
import { ReviewService } from '../../core/services/review.service';
import { ModalService } from '../../core/services/modal.service';
import { env } from '../../../env/env';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './my-orders.component.html'
})
export class MyOrders implements OnInit, OnDestroy {
  orders: IOrder[] = [];
  isLoading = true;
  message = '';
  staticURL = env.staticURL;

  selectedOrderForReview: IOrder | null = null;
  selectedProductId: string = '';
  reviewText: string = '';
  reviewRating: number = 5;
  isSubmittingReview = false;
  errorMessage = '';

  private subscriptions = new Subscription();

  constructor(
    private _orderService: OrderService,
    private _reviewService: ReviewService,
    private _modalService: ModalService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMyOrders();
  }

  // Fetches user order history
  loadMyOrders() {
    this.isLoading = true;
    const sub = this._orderService.getMyOrders().subscribe({
      next: (res) => {
        this.orders = res.data || [];
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

  // Checks order cancellation eligibility
  canCancel(status: string): boolean {
    return status === 'pending' || status === 'prepared';
  }

  isCancelled(status: string): boolean {
    return status === 'cancelledByUser' || status === 'cancelledByAdmin' || status === 'rejected';
  }

  // Cancels pending user order
  async cancelOrder(orderId: string) {
    const confirmed = await this._modalService.confirm({
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? This action will refund item stocks.',
      confirmText: 'Yes, Cancel Order',
      cancelText: 'Keep Order',
      type: 'danger'
    });

    if (!confirmed) return;

    const sub = this._orderService.updateOrderStatus(orderId, 'cancelledByUser').subscribe({
      next: () => {
        this.message = 'Order cancelled successfully! Stock refunded.';
        this.loadMyOrders();
        this._cdr.detectChanges();
        setTimeout(() => {
          this.message = '';
          this._cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this._modalService.alert({
          title: 'Order Cancellation Failed',
          message: err?.error?.message || 'Error occurred while cancelling order.',
          type: 'danger'
        });
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  // Opens order review modal
  openReviewModal(order: IOrder) {
    this.selectedOrderForReview = order;
    this.selectedProductId = order.items && order.items[0] ? (order.items[0].productId?._id || order.items[0].productId) : '';
    this.reviewText = '';
    this.reviewRating = 5;
    this.errorMessage = '';
    this._cdr.detectChanges();
  }

  closeReviewModal() {
    this.selectedOrderForReview = null;
    this.selectedProductId = '';
    this.reviewText = '';
    this._cdr.detectChanges();
  }

  // Submits customer review feedback
  submitReview() {
    if (!this.reviewText.trim()) {
      this.errorMessage = 'Please write your review feedback.';
      this._cdr.detectChanges();
      return;
    }

    this.isSubmittingReview = true;
    this.errorMessage = '';
    this._cdr.detectChanges();

    const payload = {
      text: this.reviewText,
      rating: Number(this.reviewRating),
      productId: this.selectedProductId || undefined
    };

    const sub = this._reviewService.addReview(payload).subscribe({
      next: (res) => {
        this.isSubmittingReview = false;
        this.message = res.message || 'Review submitted successfully! Pending admin approval.';
        this.closeReviewModal();
        this._cdr.detectChanges();
        setTimeout(() => {
          this.message = '';
          this._cdr.detectChanges();
        }, 4000);
      },
      error: (err) => {
        this.isSubmittingReview = false;
        this.errorMessage = err?.error?.message || 'You can only submit a review after receiving the order.';
        this._cdr.detectChanges();
      }
    });

    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
