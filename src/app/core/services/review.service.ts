import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { env } from '../../../env/env';

export interface IReview {
  _id: string;
  userId?: any;
  productId?: any;
  text: string;
  rating: number;
  status: 'Pending' | 'Approved' | 'Cancelled';
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiURL = env.apiURL + 'review';

  constructor(private _http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Fetches approved store testimonials
  getApprovedReviews() {
    return this._http.get<{ status: string; data: IReview[] }>(`${this.apiURL}/testimonials`);
  }

  // Fetches all customer reviews
  getAllReviews() {
    return this._http.get<{ status: string; data: IReview[] }>(this.apiURL, { headers: this.getHeaders() });
  }

  // Submits customer review feedback
  addReview(payload: { text: string; rating: number; productId?: string }) {
    return this._http.post<{ status: string; message: string; data: IReview }>(
      this.apiURL,
      payload,
      { headers: this.getHeaders() }
    );
  }

  // Updates customer review status
  updateReviewStatus(id: string, status: 'Pending' | 'Approved' | 'Cancelled') {
    return this._http.patch<{ status: string; data: IReview }>(
      `${this.apiURL}/${id}/status`,
      { status },
      { headers: this.getHeaders() }
    );
  }
}
