import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from '../../../env/env';
import { IReview, IProductReviewsRes } from '../models/review.model';

export type { IReview };

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiURL = env.apiURL + 'review';

  constructor(private _http: HttpClient) { }

  // Fetches approved product-level reviews & rating breakdown
  getProductReviews(productId: string): Observable<IProductReviewsRes> {
    return this._http.get<IProductReviewsRes>(`${this.apiURL}/product/${productId}`);
  }

  // Fetches approved store testimonials
  getApprovedReviews(): Observable<{ status: string; data: IReview[] }> {
    return this._http.get<{ status: string; data: IReview[] }>(`${this.apiURL}/testimonials`);
  }

  // Fetches all customer reviews for Admin moderation
  getAllReviews(): Observable<{ status: string; results: number; data: IReview[] }> {
    return this._http.get<{ status: string; results: number; data: IReview[] }>(this.apiURL);
  }

  // Submits verified buyer product review
  addReview(payload: { productId: string; text: string; rating: number; orderId?: string }): Observable<{ status: string; message: string; data: IReview }> {
    return this._http.post<{ status: string; message: string; data: IReview }>(
      this.apiURL,
      payload
    );
  }

  // Updates customer review status (Admin)
  updateReviewStatus(id: string, status: 'Pending' | 'Approved' | 'Cancelled'): Observable<{ status: string; message: string; data: IReview }> {
    return this._http.patch<{ status: string; message: string; data: IReview }>(
      `${this.apiURL}/${id}/status`,
      { status }
    );
  }

  // Deletes review permanently (Admin)
  deleteReview(id: string): Observable<{ status: string; message: string }> {
    return this._http.delete<{ status: string; message: string }>(`${this.apiURL}/${id}`);
  }
}
