import { Injectable } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { ProductService } from './product.service';
import { IProduct } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductCacheService {
  private cache$: Observable<IProduct[]> | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_DURATION_MS = 2 * 60 * 1000; // 2 minutes TTL

  constructor(private _productService: ProductService) {
    // Automatically invalidate cache on any product addition, update, or deletion
    this._productService.productMutated$.subscribe(() => {
      this.invalidateCache();
    });
  }

  // Returns cached products observable (fetches from API only when empty or expired)
  getProducts(): Observable<IProduct[]> {
    const isExpired = Date.now() - this.lastFetchTime > this.CACHE_DURATION_MS;

    if (!this.cache$ || isExpired) {
      this.lastFetchTime = Date.now();
      this.cache$ = this._productService.getAllProducts().pipe(
        map(res => (res.data || []).filter(p => p.isActive !== false && p.isDeleted !== true)),
        shareReplay(1)
      );
    }

    return this.cache$;
  }

  // Clears frontend cache when products are modified by admin
  invalidateCache(): void {
    this.cache$ = null;
    this.lastFetchTime = 0;
  }
}
