import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';

export const mathuserGuard: CanMatchFn = (route, segments) => {
  const _authService = inject(AuthService);
  const _router = inject(Router);
  if (_authService.isUser() === 'user' || _authService.isUser() === 'admin') {
    return true;
  }
  _router.navigate(['/login']);
  return false;
};
