import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateFn = (route, state) => {
  const _authService = inject(AuthService);
  const _router = inject(Router);
  if (_authService.isUser() === 'user' || _authService.isUser() === 'admin') {
    return true;
  }
  _router.navigate(['/login']);
  return false;
};
