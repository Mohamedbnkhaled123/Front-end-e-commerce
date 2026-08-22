import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, take } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const mathuserGuard: CanMatchFn = (route, segments) => {
  const _authService = inject(AuthService);
  const _router = inject(Router);

  return _authService.authReady$.pipe(
    take(1),
    map(() => {
      const role = _authService.isUser();
      if (role === 'user' || role === 'admin') {
        return true;
      }
      _router.navigate(['/login']);
      return false;
    })
  );
};
