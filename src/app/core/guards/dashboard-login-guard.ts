import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, take } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const dashboardLoginGuard: CanActivateFn = (route, state) => {
  const _authService = inject(AuthService);
  const _router = inject(Router);
  
  return _authService.authReady$.pipe(
    take(1),
    map(() => {
      const token = _authService.getToken();
      const role = _authService.isUser();

      // If a regular user is logged in, block access to dashboard-login and redirect to 404
      if (token && role === 'user') {
        _router.navigate(['/404']);
        return false;
      }

      // If admin or superadmin is logged in, redirect straight to admin panel
      if (token && (role === 'admin' || role === 'superadmin')) {
        _router.navigate(['/admin/analytics']);
        return false;
      }

      return true;
    })
  );
};
