import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ICmsPageRes, ICmsUpdateRes, CmsPageName } from '../models/cms.model';
import { env } from '../../../env/env';
import { from, Observable, of, shareReplay, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';

const API_BASE = `${env.apiURL}cms`;

@Injectable({
  providedIn: 'root'
})
export class CmsService {
  private pageCache = new Map<CmsPageName, { observable: Observable<ICmsPageRes>; timestamp: number }>();
  private readonly CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes TTL

  constructor(private _http: HttpClient) {}

  // Fetches CMS page content (cached in-memory per pageName)
  getPage(pageName: CmsPageName): Observable<ICmsPageRes> {
    if (pageName === 'Home' && typeof window !== 'undefined' && (window as any).__cmsHomePromise) {
      const promise = (window as any).__cmsHomePromise;
      (window as any).__cmsHomePromise = null;
      
      const observable = from(promise as Promise<any>).pipe(
        switchMap(res => {
          if (!res) {
            return this._http.get<ICmsPageRes>(`${API_BASE}/${pageName}`);
          }
          return of(res as ICmsPageRes);
        }),
        shareReplay(1)
      );
      this.pageCache.set(pageName, { observable, timestamp: Date.now() });
      return observable;
    }

    const cached = this.pageCache.get(pageName);
    const isExpired = !cached || (Date.now() - cached.timestamp > this.CACHE_DURATION_MS);

    if (isExpired) {
      const observable = this._http.get<ICmsPageRes>(`${API_BASE}/${pageName}`).pipe(
        shareReplay(1)
      );
      this.pageCache.set(pageName, { observable, timestamp: Date.now() });
      return observable;
    }

    return cached.observable;
  }

  // Updates CMS page content and invalidates cache
  updatePage(pageName: CmsPageName, content: string) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this._http.post<ICmsUpdateRes>(`${API_BASE}/update`, { pageName, content }, { headers }).pipe(
      tap(() => this.invalidatePage(pageName))
    );
  }

  // Uploads CMS hero image and invalidates Home cache
  uploadHeroImage(blob: Blob, fileName: string) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    const formData = new FormData();
    formData.append('heroImage', blob, fileName);

    return this._http.post<{ status: string; message: string; url: string }>(`${API_BASE}/upload-hero`, formData, { headers }).pipe(
      tap(() => this.invalidatePage('Home'))
    );
  }

  invalidatePage(pageName: CmsPageName): void {
    this.pageCache.delete(pageName);
  }

  invalidateAll(): void {
    this.pageCache.clear();
  }
}
