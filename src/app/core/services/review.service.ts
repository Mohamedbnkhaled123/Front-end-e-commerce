import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { env } from '../../../env/env';
import { IReview, IProductReviewsRes } from '../models/review.model';

export type { IReview };

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiURL = env.apiURL + 'review';
  private cache = new Map<string, Observable<any>>();

  constructor(private _http: HttpClient) { }

  public clearCache(): void {
    this.cache.clear();
  }

  // Fetches approved product-level reviews & rating breakdown (cached in-memory per session)
  getProductReviews(productId: string): Observable<IProductReviewsRes> {
    const cacheKey = `getProductReviews:${productId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const req$ = this._http.get<IProductReviewsRes>(`${this.apiURL}/product/${productId}`).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        this.cache.delete(cacheKey);
        return throwError(() => err);
      })
    );

    this.cache.set(cacheKey, req$);
    return req$;
  }

  // Fetches approved store testimonials (cached in-memory per session)
  getApprovedReviews(): Observable<{ status: string; data: IReview[] }> {
    const cacheKey = 'getApprovedReviews';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const req$ = this._http.get<{ status: string; data: IReview[] }>(`${this.apiURL}/testimonials`).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        this.cache.delete(cacheKey);
        return throwError(() => err);
      })
    );

    this.cache.set(cacheKey, req$);
    return req$;
  }

  // Fetches all customer reviews for Admin moderation (cached in-memory per session)
  getAllReviews(): Observable<{ status: string; results: number; data: IReview[] }> {
    const cacheKey = 'getAllReviews';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const req$ = this._http.get<{ status: string; results: number; data: IReview[] }>(this.apiURL).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        this.cache.delete(cacheKey);
        return throwError(() => err);
      })
    );

    this.cache.set(cacheKey, req$);
    return req$;
  }

  // Submits verified buyer product review
  addReview(payload: { productId: string; text: string; rating: number; orderId?: string }): Observable<{ status: string; message: string; data: IReview }> {
    return this._http.post<{ status: string; message: string; data: IReview }>(
      this.apiURL,
      payload
    ).pipe(
      tap(() => this.clearCache())
    );
  }

  // Updates customer review status (Admin)
  updateReviewStatus(id: string, status: 'Pending' | 'Approved' | 'Cancelled'): Observable<{ status: string; message: string; data: IReview }> {
    return this._http.patch<{ status: string; message: string; data: IReview }>(
      `${this.apiURL}/${id}/status`,
      { status }
    ).pipe(
      tap(() => this.clearCache())
    );
  }

  // Deletes review permanently (Admin)
  deleteReview(id: string): Observable<{ status: string; message: string }> {
    return this._http.delete<{ status: string; message: string }>(`${this.apiURL}/${id}`).pipe(
      tap(() => this.clearCache())
    );
  }
}
