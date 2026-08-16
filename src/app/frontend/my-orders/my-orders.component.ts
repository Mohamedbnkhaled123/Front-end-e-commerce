import { LocalizeFieldPipe } from '../../core/pipes/localize-field.pipe';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, IOrder } from '../../core/services/order.service';
import { ReviewService } from '../../core/services/review.service';
import { ModalService } from '../../core/services/modal.service';
import { LanguageService } from '../../core/services/language.service';
import { env } from '../../../env/env';
import { Subscription } from 'rxjs';

import { CouponService } from '../../core/services/coupon.service';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [TranslatePipe, CommonModule, RouterLink, FormsModule, SkeletonComponent, LocalizeFieldPipe],
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

  @ViewChild('reviewModal') reviewModal!: ElementRef<HTMLDialogElement>;

  private subscriptions = new Subscription();

  constructor(
    private _orderService: OrderService,
    private _reviewService: ReviewService,
    private _couponService: CouponService,
    private _modalService: ModalService,
    private _langService: LanguageService,
    private _cdr: ChangeDetectorRef,
    private _router: Router
  ) {}

  getOrderCoupon(order: IOrder): { code: string; discountPercent: number; discountAmount: number } | null {
    return this._couponService.extractOrderCoupon(order);
  }

  getEffectiveTotal(order: IOrder): number {
    const coupon = this.getOrderCoupon(order);
    if (coupon && coupon.discountAmount > 0) {
      return Math.max(0, Number((order.totalPrice - coupon.discountAmount).toFixed(2)));
    }
    return order.totalPrice;
  }

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

  // Opens product review modal for a specific purchased item
  openReviewModal(order: IOrder, specificProductId?: string) {
    this.selectedOrderForReview = order;
    if (specificProductId) {
      this.selectedProductId = specificProductId;
    } else {
      const firstProduct = order.items && order.items[0] ? order.items[0].productId : null;
      this.selectedProductId = typeof firstProduct === 'object' && firstProduct ? firstProduct._id : (firstProduct || '');
    }

    this.reviewText = '';
    this.reviewRating = 5;
    this.errorMessage = '';
    this._cdr.detectChanges();

    if (this.reviewModal?.nativeElement) {
      this.reviewModal.nativeElement.showModal();
    }
  }

  closeReviewModal() {
    if (this.reviewModal?.nativeElement) {
      this.reviewModal.nativeElement.close();
    }
    this.selectedOrderForReview = null;
    this.selectedProductId = '';
    this.reviewText = '';
    this._cdr.detectChanges();
  }

  // Submits verified product review feedback
  submitReview() {
    if (!this.selectedProductId) {
      this.errorMessage = 'Please select a product to review.';
      this._cdr.detectChanges();
      return;
    }

    this.isSubmittingReview = true;
    this.errorMessage = '';
    this._cdr.detectChanges();

    const payload = {
      productId: this.selectedProductId,
      orderId: this.selectedOrderForReview?._id,
      text: this.reviewText,
      rating: Number(this.reviewRating)
    };

    const sub = this._reviewService.addReview(payload).subscribe({
      next: (res) => {
        this.isSubmittingReview = false;
        this.message = this._langService.translate('orders.review_thanks');
        
        const productIdToNavigate = this.selectedProductId;
        
        this.closeReviewModal();
        this._cdr.detectChanges();
        
        // Navigate to product details page immediately, scrolling to reviews
        this._router.navigate(['/products', productIdToNavigate], { fragment: 'reviews' });
        
        setTimeout(() => {
          this.message = '';
          this._cdr.detectChanges();
        }, 4000);
      },
      error: (err) => {
        this.isSubmittingReview = false;
        this.errorMessage = err?.error?.message || 'Failed to submit review. Ensure order status is received.';
        this._cdr.detectChanges();
      }
    });

    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}

