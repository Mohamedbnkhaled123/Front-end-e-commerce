import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CouponService } from '../../core/services/coupon.service';
import { ModalService } from '../../core/services/modal.service';
import { ICoupon } from '../../core/models/coupon.model';

import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './admin-coupons.component.html'
})
export class AdminCoupons implements OnInit, OnDestroy {
  coupons: ICoupon[] = [];
  isLoading = false;
  isCreating = false;
  showCreateModal = false;
  message = '';
  errorMsg = '';

  // New Coupon Form Fields
  newCode = '';
  newDiscountPercent: number | null = null;
  newMaxDiscountAmount: number | null = null;
  newMinOrderAmount: number | null = 0;
  newExpiresAt = '';
  newUsageLimit: number | null = null;

  private subscriptions = new Subscription();

  constructor(
    private _couponService: CouponService,
    private _modalService: ModalService,
    private _cdr: ChangeDetectorRef,
    public _langService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.isLoading = true;
    this._cdr.detectChanges();

    const sub = this._couponService.getAllCoupons().subscribe({
      next: (res) => {
        this.coupons = res.data || [];
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

  openModal(): void {
    this.showCreateModal = true;
    this.errorMsg = '';
  }

  closeModal(): void {
    this.showCreateModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.newCode = '';
    this.newDiscountPercent = null;
    this.newMaxDiscountAmount = null;
    this.newMinOrderAmount = 0;
    this.newExpiresAt = '';
    this.newUsageLimit = null;
  }

  onCreateCoupon(): void {
    this.errorMsg = '';
    if (!this.newCode || !this.newDiscountPercent) {
      this.errorMsg = 'Please enter Promo Code and Discount Percent.';
      return;
    }

    this.isCreating = true;
    this._cdr.detectChanges();

    const payload: Partial<ICoupon> = {
      code: this.newCode.trim().toUpperCase(),
      discountPercent: Number(this.newDiscountPercent),
      maxDiscountAmount: this.newMaxDiscountAmount ? Number(this.newMaxDiscountAmount) : null,
      minOrderAmount: this.newMinOrderAmount ? Number(this.newMinOrderAmount) : 0,
      expiresAt: this.newExpiresAt ? this.newExpiresAt : null,
      usageLimit: this.newUsageLimit ? Number(this.newUsageLimit) : null
    };

    const sub = this._couponService.createCoupon(payload).subscribe({
      next: (res) => {
        this.isCreating = false;
        this.message = res.message || 'Coupon created successfully!';
        this.closeModal();
        this.loadCoupons();
        setTimeout(() => { this.message = ''; this._cdr.detectChanges(); }, 3000);
      },
      error: (err) => {
        this.isCreating = false;
        this.errorMsg = err?.error?.message || 'Failed to create coupon.';
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  toggleStatus(coupon: ICoupon): void {
    const sub = this._couponService.toggleCouponStatus(coupon._id).subscribe({
      next: (res) => {
        coupon.isActive = res.data.isActive;
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  async deleteCoupon(coupon: ICoupon): Promise<void> {
    const confirmed = await this._modalService.confirm({
      title: 'Delete Promo Coupon',
      message: `Are you sure you want to permanently delete coupon '${coupon.code}'?`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    const sub = this._couponService.deleteCoupon(coupon._id).subscribe({
      next: () => {
        this.message = `Coupon '${coupon.code}' deleted.`;
        this.loadCoupons();
        setTimeout(() => { this.message = ''; this._cdr.detectChanges(); }, 3000);
      }
    });
    this.subscriptions.add(sub);
  }

  isExpired(expiresAt?: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
