import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ICmsPageRes, ICmsUpdateRes, CmsPageName } from '../models/cms.model';
import { env } from '../../../env/env';
import { from, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

const API_BASE = `${env.apiURL}cms`;

@Injectable({
  providedIn: 'root'
})
export class CmsService {
  constructor(private _http: HttpClient) {}

  // Fetches CMS page content
  getPage(pageName: CmsPageName): Observable<ICmsPageRes> {
    if (pageName === 'Home' && typeof window !== 'undefined' && (window as any).__cmsHomePromise) {
      const promise = (window as any).__cmsHomePromise;
      // Clear the promise to ensure fresh fetches on subsequent navigations
      (window as any).__cmsHomePromise = null;
      
      return from(promise as Promise<any>).pipe(
        switchMap(res => {
          if (!res) {
            // Fallback if the prefetch failed
            return this._http.get<ICmsPageRes>(`${API_BASE}/${pageName}`);
          }
          return of(res as ICmsPageRes);
        })
      );
    }
    return this._http.get<ICmsPageRes>(`${API_BASE}/${pageName}`);
  }

  // Updates CMS page content
  updatePage(pageName: CmsPageName, content: string) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this._http.post<ICmsUpdateRes>(`${API_BASE}/update`, { pageName, content }, { headers });
  }

  // Uploads CMS hero image
  uploadHeroImage(blob: Blob, fileName: string) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    const formData = new FormData();
    formData.append('heroImage', blob, fileName);

    return this._http.post<{ status: string; message: string; url: string }>(`${API_BASE}/upload-hero`, formData, { headers });
  }
}
