import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { env } from '../../../env/env';
import { ICategory } from '../models/category.model';

export type { ICategory };

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiURL = env.apiURL + 'category';
  private cache$: Observable<{ status: string; data: ICategory[] }> | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes TTL

  constructor(private _http: HttpClient) {}

  getCategories(): Observable<{ status: string; data: ICategory[] }> {
    const isExpired = Date.now() - this.lastFetchTime > this.CACHE_DURATION_MS;

    if (!this.cache$ || isExpired) {
      this.lastFetchTime = Date.now();
      this.cache$ = this._http.get<{ status: string; data: ICategory[] }>(this.apiURL).pipe(
        shareReplay(1)
      );
    }

    return this.cache$;
  }

  addCategory(payload: any) {
    return this._http.post<{ status: string; message: string; data: ICategory }>(
      this.apiURL, 
      payload
    ).pipe(
      tap(() => this.invalidateCache())
    );
  }

  invalidateCache(): void {
    this.cache$ = null;
    this.lastFetchTime = 0;
  }
}


