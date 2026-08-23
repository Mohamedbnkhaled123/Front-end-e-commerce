import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { env } from '../../../env/env';
import { IProductListRes, IProductRes } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiURL = env.apiURL + 'product';

  // In-memory application-session cache for product requests
  private cache = new Map<string, Observable<any>>();

  // Event stream notifying components & caches when products are created, edited, deleted, or restored
  public productMutated$ = new Subject<void>();

  constructor(private _http: HttpClient) {}

  private notifyMutation() {
    this.clearCache();
    this.productMutated$.next();
  }

  // Explicitly clears the in-memory product request cache
  public clearCache(): void {
    this.cache.clear();
  }

  private buildParamsKey(params?: any): string {
    if (!params) return 'all';
    const keys = Object.keys(params).sort();
    return keys
      .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
      .map(k => `${k}=${params[k]}`)
      .join('&') || 'all';
  }

  // Fetches all store products (now with server-side pagination & in-memory session caching)
  getAllProducts(params?: any): Observable<IProductListRes> {
    let queryParams = new HttpParams();
    if (params) {
      if (params.page) queryParams = queryParams.set('page', params.page);
      if (params.limit) queryParams = queryParams.set('limit', params.limit);
      if (params.search) queryParams = queryParams.set('search', params.search);
      if (params.category) queryParams = queryParams.set('category', params.category);
      if (params.subCategory) queryParams = queryParams.set('subCategory', params.subCategory);
      if (params.minPrice !== undefined && params.minPrice !== null && params.minPrice !== '') {
        queryParams = queryParams.set('minPrice', params.minPrice);
      }
      if (params.maxPrice !== undefined && params.maxPrice !== null && params.maxPrice !== '') {
        queryParams = queryParams.set('maxPrice', params.maxPrice);
      }
      if (params.all) queryParams = queryParams.set('all', params.all);
    }

    const cacheKey = `getAllProducts:${this.buildParamsKey(params)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const req$ = this._http.get<IProductListRes>(this.apiURL, { params: queryParams }).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        this.cache.delete(cacheKey);
        return throwError(() => err);
      })
    );

    this.cache.set(cacheKey, req$);
    return req$;
  }

  // Fetches single product details by slug (cached in-memory per session)
  getProductBySlug(slug: string): Observable<IProductRes> {
    const cleanSlug = (slug || '').toLowerCase().trim();
    const cacheKey = `getProductBySlug:${cleanSlug}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const req$ = this._http.get<IProductRes>(`${this.apiURL}/${cleanSlug}`).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        this.cache.delete(cacheKey);
        return throwError(() => err);
      })
    );

    this.cache.set(cacheKey, req$);
    return req$;
  }

  // Fetches single product details by ID (cached in-memory per session)
  getProductById(id: string): Observable<IProductRes> {
    const cleanId = (id || '').trim();
    const cacheKey = `getProductById:${cleanId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const req$ = this._http.get<IProductRes>(`${this.apiURL}/id/${cleanId}`).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        this.cache.delete(cacheKey);
        return throwError(() => err);
      })
    );

    this.cache.set(cacheKey, req$);
    return req$;
  }

  // Fetches related category products (cached in-memory per session)
  getRelatedProducts(slug: string): Observable<IProductListRes> {
    const cleanSlug = (slug || '').toLowerCase().trim();
    const cacheKey = `getRelatedProducts:${cleanSlug}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const req$ = this._http.get<IProductListRes>(`${this.apiURL}/related/${cleanSlug}`).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        this.cache.delete(cacheKey);
        return throwError(() => err);
      })
    );

    this.cache.set(cacheKey, req$);
    return req$;
  }

  // Creates new store product
  addProduct(payload: any) {
    return this._http.post<IProductRes>(this.apiURL, payload).pipe(
      tap(() => this.notifyMutation())
    );
  }

  // Updates existing product details
  updateProduct(id: string, payload: any) {
    return this._http.patch<IProductRes>(`${this.apiURL}/${id}`, payload).pipe(
      tap(() => this.notifyMutation())
    );
  }

  // Soft deletes product by ID
  deleteProduct(id: string) {
    return this._http.delete<{ status: string; message: string }>(`${this.apiURL}/${id}`).pipe(
      tap(() => this.notifyMutation())
    );
  }

  // Permanently deletes product by ID (Hard Delete)
  permanentDeleteProduct(id: string) {
    return this._http.delete<{ status: string; message: string }>(`${this.apiURL}/${id}/permanent`).pipe(
      tap(() => this.notifyMutation())
    );
  }

  // Restore product
  restoreProduct(id: string) {
    return this._http.patch(`${this.apiURL}/${id}/restore`, {}).pipe(
      tap(() => this.notifyMutation())
    );
  }
}
