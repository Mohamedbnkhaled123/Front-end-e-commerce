import { LocalizeFieldPipe } from '../../core/pipes/localize-field.pipe';
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService, IReview } from '../../core/services/review.service';
import { ModalService } from '../../core/services/modal.service';
import { Subscription } from 'rxjs';

import { env } from '../../../env/env';

import { TranslatePipe } from '../../core/pipes/translate.pipe';

import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, TranslatePipe, LocalizeFieldPipe],
  templateUrl: './admin-reviews.component.html'
})
export class AdminReviews implements OnInit, OnDestroy {
  reviews = signal<IReview[]>([]);
  isLoading = signal<boolean>(false);
  message = signal<string>('');
  staticURL = env.staticURL;
  private subscriptions = new Subscription();

  constructor(
    private _reviewService: ReviewService,
    private _modalService: ModalService,
    public _langService: LanguageService
  ) { }

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews() {
    this.isLoading.set(true);

    const sub = this._reviewService.getAllReviews().subscribe({
      next: (res) => {
        this.reviews.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
    this.subscriptions.add(sub);
  }

  changeStatus(id: string, status: 'Pending' | 'Approved' | 'Cancelled') {
    const sub = this._reviewService.updateReviewStatus(id, status).subscribe({
      next: () => {
        this.message.set(`Review status changed to '${status}' successfully!`);
        this.loadReviews();
        setTimeout(() => {
          this.message.set('');
        }, 3000);
      },
      error: (err) => {
        this._modalService.alert({
          title: 'Update Failed',
          message: err?.error?.message || 'Error updating review status.',
          type: 'danger'
        });
      }
    });
    this.subscriptions.add(sub);
  }

  getStars(rating: number): number[] {
    return Array(rating || 5).fill(0);
  }

  async deleteReview(id: string) {
    const confirmed = await this._modalService.confirm({
      title: 'Delete Review',
      message: 'Are you sure you want to permanently delete this customer review? This action cannot be undone.',
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!confirmed) return;

    const sub = this._reviewService.deleteReview(id).subscribe({
      next: () => {
        this.message.set('Review permanently deleted successfully!');
        this.loadReviews();
        setTimeout(() => {
          this.message.set('');
        }, 3000);
      },
      error: (err) => {
        this._modalService.alert({
          title: 'Delete Failed',
          message: err?.error?.message || 'Error deleting review.',
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
