import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from '../services/auth/auth.service';
import {inject} from '@angular/core';
import {catchError, map, of} from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  const token = authService.getAccessToken();
  if (token) {
    return authService.fetchCurrentUser().pipe(
      map(user => {
        if (user) {
          return true;
        }
        return router.createUrlTree(['/login']);
      }),
      catchError(() => {
        authService.logout();
        return of(router.createUrlTree(['/login']));
      })
    );
  }

  return router.createUrlTree(['/login']);

}
