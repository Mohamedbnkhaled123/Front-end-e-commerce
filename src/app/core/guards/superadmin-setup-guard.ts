import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';
import { map, catchError, of } from 'rxjs';

export const superadminSetupGuard: CanActivateFn = (route, state) => {
  const _authService = inject(AuthService);
  const _router = inject(Router);

  return _authService.checkSuperAdminStatus().pipe(
    map((res) => {
      if (res.exists) {
        // Super admin already claimed! Redirect away to dashboard login
        const role = _authService.isUser();
        if (role === 'admin' || role === 'superadmin') {
          _router.navigate(['/admin/analytics']);
        } else {
          _router.navigate(['/dashboard-login']);
        }
        return false;
      }
      return true;
    }),
    catchError(() => {
      // On error, default to allowing or redirecting safely
      return of(true);
    })
  );
};
