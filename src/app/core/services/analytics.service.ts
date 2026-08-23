import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { env } from '../../../env/env';
import { IOrder } from '../models/order.model';

export interface IFinancialKPIs {
  grossRevenue: number;
  totalDiscounts: number;
  totalShipping: number;
  netRevenue: number;
  approvedRevenue?: number;
  approvedOrderCount: number;
  lostRevenue: number;
  cancelledOrderCount: number;
  pendingRevenue: number;
  pendingOrderCount: number;
  returnedOrderCount: number;
  returnedRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  returnRate: number;
}

export interface IGrowthDeltas {
  netRevenueGrowth: number | null;
  orderCountGrowth: number | null;
  aovGrowth: number | null;
}

export interface IRevenueTrendPoint {
  date: string;
  revenue: number;
  grossRevenue?: number;
  orders: number;
}

export interface IFinancialAnalyticsRes {
  status: string;
  data: {
    kpis: IFinancialKPIs;
    growth: IGrowthDeltas;
    revenueTrend: IRevenueTrendPoint[];
  };
}

export interface ITopProduct {
  _id: string;
  name: string;
  imgURL: string;
  price: number;
  categoryName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface ICategoryBreakdown {
  _id: string;
  revenue: number;
  quantitySold: number;
  orderCount: number;
  percentage: number;
}

export interface IProductAnalyticsRes {
  status: string;
  data: {
    topProducts: ITopProduct[];
    categoryBreakdown: ICategoryBreakdown[];
  };
}

export interface IOrderAuditRes {
  status: string;
  data: {
    orders: IOrder[];
    funnel: {
      approved: number;
      pending: number;
      cancelled: number;
      returned?: number;
    };
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface IReviewAnalyticsRes {
  status: string;
  data: {
    averageRating: number;
    totalApprovedReviews: number;
    totalAllReviews: number;
    starBreakdown: Record<number, number>;
    moderationBreakdown: {
      Approved: number;
      Pending: number;
      Cancelled: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiURL = env.apiURL + 'analytics';
  private cache = new Map<string, Observable<any>>();

  constructor(private _http: HttpClient) {}

  public clearCache(): void {
    this.cache.clear();
  }

  getFinancialAnalytics(range: string = 'month', from?: string, to?: string): Observable<IFinancialAnalyticsRes> {
    const cacheKey = `financial:${range}:${from || ''}:${to || ''}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    let params = new HttpParams().set('range', range);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    const req$ = this._http.get<IFinancialAnalyticsRes>(`${this.apiURL}/financial`, { params }).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        this.cache.delete(cacheKey);
        return throwError(() => err);
      })
    );

    this.cache.set(cacheKey, req$);
    return req$;
  }

  getProductAnalytics(range: string = 'month', from?: string, to?: string): Observable<IProductAnalyticsRes> {
    const cacheKey = `products:${range}:${from || ''}:${to || ''}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    let params = new HttpParams().set('range', range);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    const req$ = this._http.get<IProductAnalyticsRes>(`${this.apiURL}/products`, { params }).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        this.cache.delete(cacheKey);
        return throwError(() => err);
      })
    );

    this.cache.set(cacheKey, req$);
    return req$;
  }

  getOrderAudit(range: string = 'month', page: number = 1, limit: number = 10, status: string = 'all', from?: string, to?: string): Observable<IOrderAuditRes> {
    const cacheKey = `orders:${range}:${page}:${limit}:${status}:${from || ''}:${to || ''}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    let params = new HttpParams()
      .set('range', range)
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('status', status);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    const req$ = this._http.get<IOrderAuditRes>(`${this.apiURL}/orders`, { params }).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        this.cache.delete(cacheKey);
        return throwError(() => err);
      })
    );

    this.cache.set(cacheKey, req$);
    return req$;
  }

  getReviewAnalytics(): Observable<IReviewAnalyticsRes> {
    const cacheKey = 'reviews';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const req$ = this._http.get<IReviewAnalyticsRes>(`${this.apiURL}/reviews`).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        this.cache.delete(cacheKey);
        return throwError(() => err);
      })
    );

    this.cache.set(cacheKey, req$);
    return req$;
  }
}
