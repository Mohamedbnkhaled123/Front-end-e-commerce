import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService, IReview } from '../../core/services/review.service';
import { ModalService } from '../../core/services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-reviews.component.html'
})
export class AdminReviews implements OnInit, OnDestroy {
  reviews: IReview[] = [];
  isLoading = false;
  message = '';
  private subscriptions = new Subscription();

  constructor(
    private _reviewService: ReviewService,
    private _modalService: ModalService,
    private _cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews() {
    this.isLoading = true;
    this._cdr.detectChanges();

    const sub = this._reviewService.getAllReviews().subscribe({
      next: (res) => {
        this.reviews = res.data || [];
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

  changeStatus(id: string, status: 'Pending' | 'Approved' | 'Cancelled') {
    const sub = this._reviewService.updateReviewStatus(id, status).subscribe({
      next: () => {
        this.message = `Review status changed to '${status}' successfully!`;
        this.loadReviews();
        this._cdr.detectChanges();
        setTimeout(() => {
          this.message = '';
          this._cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this._modalService.alert({
          title: 'Update Failed',
          message: err?.error?.message || 'Error updating review status.',
          type: 'danger'
        });
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  getStars(rating: number): number[] {
    return Array(rating || 5).fill(0);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
