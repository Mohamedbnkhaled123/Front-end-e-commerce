import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';

export const adminGuard: CanActivateFn = (route, state) => {
  const _authService = inject(AuthService);
  const _router = inject(Router);
  
  if (_authService.isUser() === 'admin') {
    return true;
  }
  
  _router.navigate(['/dashboard-login'], { queryParams: { error: 'unauthorized' } });
  return false;
};
