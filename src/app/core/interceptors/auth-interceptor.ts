import { HttpInterceptorFn, HttpErrorResponse, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, throwError, catchError } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { RefreshCoordinator } from '../services/refresh-coordinator';
import { env } from '../../../env/env';

export const IS_AUTH_RETRY = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const _authService = inject(AuthService);
  const _refreshCoordinator = inject(RefreshCoordinator);

  // Only add credentials and token for requests to our own API
  const isApiRequest = req.url.startsWith(env.apiURL);
  let modifiedReq = req;

  if (isApiRequest) {
    const headers: Record<string, string> = {
      'X-Requested-With': 'XMLHttpRequest'
    };
    const token = _authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    modifiedReq = req.clone({
      setHeaders: headers,
      withCredentials: true
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only attempt refresh on 401 for API requests
      if (error.status !== 401 || !isApiRequest) {
        return throwError(() => error);
      }

      // Never retry if this request was already a retry attempt
      if (req.context.get(IS_AUTH_RETRY)) {
        return throwError(() => error);
      }

      // Never retry refresh, login, or register endpoints — prevents infinite loops
      const isAuthEndpoint = req.url.includes('/auth/refresh') ||
                             req.url.includes('/auth/login') ||
                             req.url.includes('/auth/register');
      if (isAuthEndpoint) {
        return throwError(() => error);
      }

      // Attempt token refresh via coordinator (single-flight)
      return _refreshCoordinator.refresh().pipe(
        switchMap((newToken) => {
          if (!newToken) {
            // Refresh failed — propagate the original 401
            return throwError(() => error);
          }

          // Update in-memory token and retry the original request with retry flag set
          _authService.setAccessTokenInMemory(newToken);
          req.context.set(IS_AUTH_RETRY, true);
          const retryReq = req.clone({
            context: req.context,
            setHeaders: {
              'Authorization': `Bearer ${newToken}`,
              'X-Requested-With': 'XMLHttpRequest'
            },
            withCredentials: true
          });
          return next(retryReq);
        })
      );
    })
  );
};
