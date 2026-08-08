import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { ModalService } from '../services/modal.service';

import { env } from '../../../env/env';

let lastConnectionErrorAt = 0;

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const _router = inject(Router);
  const _authService = inject(AuthService);
  const _modalService = inject(ModalService);

  return next(req).pipe(catchError((error) => {
    if (!env.production) {
      console.error('HTTP Error caught by interceptor:', error);
    }
    if (error.status === 401) {
      _authService.clearTokenWithoutRedirect();
      if (!_router.url.includes('/login') && !_router.url.includes('/dashboard-login')) {
        _router.navigate(['/login']);
      }
    } else if (error.status === 403) {
      const userRole = _authService.isUser();
      if (userRole) {
        _modalService.alert({
          title: 'Access Denied',
          message: error?.error?.message || 'You do not have permission to perform this action or view this resource.',
          type: 'warning'
        });
        _router.navigate([userRole === 'admin' || userRole === 'superadmin' ? '/admin/home' : '/home']);
      } else {
        _router.navigate(['/login']);
      }
    } else if (error.status === 0) {
      const now = Date.now();
      if (now - lastConnectionErrorAt > 5000) {
        lastConnectionErrorAt = now;
        _modalService.alert({
          title: 'Connection Error',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          type: 'danger'
        });
      }
    } else if (error.status >= 500) {
      _modalService.alert({
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        type: 'danger'
      });
    }
    return throwError(() => error);
  }));
};

