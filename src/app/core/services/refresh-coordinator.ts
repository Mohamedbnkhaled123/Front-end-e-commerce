import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError, finalize, shareReplay } from 'rxjs';
import { env } from '../../../env/env';
import { IRefreshTokenRes } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class RefreshCoordinator {
  private refreshInFlight$: Observable<string | null> | null = null;

  constructor(private _http: HttpClient) {}

  /**
   * Attempts to refresh the access token using the HttpOnly refresh cookie.
   * Guarantees at most ONE in-flight request — concurrent callers share the same observable.
   */
  refresh(): Observable<string | null> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.refreshInFlight$ = this._http.post<IRefreshTokenRes>(
      `${env.apiURL}auth/refresh`,
      {},
      { withCredentials: true }
    ).pipe(
      map(res => res.accessToken || null),
      catchError(() => of(null)),
      finalize(() => { this.refreshInFlight$ = null; }),
      shareReplay(1)
    );

    return this.refreshInFlight$;
  }
}
