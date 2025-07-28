import {HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth/auth.service';
import {catchError, filter, switchMap, take, throwError} from 'rxjs';
import {BYPASS_TOKEN_INTERCEPTOR} from '../contexts/http-context';

const addTokenHeader = (request: HttpRequest<any>, token: string) => {
  return request.clone({
    headers: request.headers.set('Authorization', `Bearer ${token}`)
  });
}

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {

  if (req.context.get(BYPASS_TOKEN_INTERCEPTOR)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const accessToken = authService.getAccessToken();

  if (accessToken) {
    req = addTokenHeader(req, accessToken);
  }

  return next(req).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(req, next, authService, error);
      }
      return throwError(() => error);
    })
  );

}

const handle401Error = (request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService, error: any) => {
  if (request.url.includes('/api/auth/logout')) {
    return throwError(() => error);
  }

  if (!authService.getIsRefreshing()) {
    authService.setIsRefreshing(true);
    authService.getRefreshTokenSubject().next(null);

    return authService.refreshToken().pipe(
      switchMap((tokens: any) => {
        authService.setIsRefreshing(false);
        authService.getRefreshTokenSubject().next(tokens.access_token);
        return next(addTokenHeader(request, tokens.access_token));
      }),
      catchError((err) => {
        authService.setIsRefreshing(false);
        authService.logout();
        return throwError(() => err);
      })
    );
  } else {
    return authService.getRefreshTokenSubject().pipe(
      filter(token => token != null),
      take(1),
      switchMap(jwt => {
        return next(addTokenHeader(request, jwt));
      })
    );
  }
}
