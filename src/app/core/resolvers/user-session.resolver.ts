import {ResolveFn} from '@angular/router';
import {Observable, of} from 'rxjs';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth/auth.service';

export const userSessionResolver: ResolveFn<any> = (route, state): Observable<any> => {
  const authService = inject(AuthService);

  if (authService.isLoggedIn()) {
    return of(true);
  }

  return authService.init();
};
