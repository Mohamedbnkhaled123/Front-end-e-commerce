import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';

export const adminGuard: CanActivateFn = (route, state) => {
  const _authService = inject(AuthService);
  const _router = inject(Router);
  
  const role = _authService.isUser();
  if (role === 'admin' || role === 'superadmin') {
    return true;
  }
  
  // Redirect non-admin users directly to 404 Not Found page
  _router.navigate(['/404']);
  return false;
};
