import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { env } from '../../../env/env';

export interface ISubCategory {
  _id: string;
  name: string;
  slug?: string;
  category?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {
  private baseUrl = `${env.apiURL}subcategory`;
  private subCatCache = new Map<string, { observable: Observable<any>; timestamp: number }>();
  private readonly CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes TTL

  constructor(private http: HttpClient) {}

  getSubCategoriesByMain(categoryId: string): Observable<any> {
    const cached = this.subCatCache.get(categoryId);
    const isExpired = !cached || (Date.now() - cached.timestamp > this.CACHE_DURATION_MS);

    if (isExpired) {
      const observable = this.http.get(`${this.baseUrl}/main/${categoryId}`).pipe(
        shareReplay(1)
      );
      this.subCatCache.set(categoryId, { observable, timestamp: Date.now() });
      return observable;
    }

    return cached.observable;
  }

  addSubCategory(payload: { name: string, slug?: string, categoryId?: string, category?: string }): Observable<any> {
    const body: any = {
      name: payload.name,
      slug: payload.slug || payload.name.trim().toLowerCase().replace(/[\s_]+/g, '-')
    };
    if (payload.categoryId) {
      body.categoryId = payload.categoryId;
      body.category = payload.categoryId;
    }
    if (payload.category) {
      body.category = payload.category;
      body.categoryId = payload.category;
    }
    return this.http.post(this.baseUrl, body).pipe(
      tap(() => {
        const catId = payload.categoryId || payload.category;
        if (catId) {
          this.invalidateCacheForCategory(catId);
        } else {
          this.invalidateAll();
        }
      })
    );
  }

  deleteSubCategory(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.invalidateAll())
    );
  }

  invalidateCacheForCategory(categoryId: string): void {
    this.subCatCache.delete(categoryId);
  }

  invalidateAll(): void {
    this.subCatCache.clear();
  }
}
