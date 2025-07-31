import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient, HttpContext, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Router} from '@angular/router';
import {UsuarioResponse} from '../../models/usuario/UsuarioResponse';
import {Credenciales} from '../../models/auth/Credenciales';
import {BehaviorSubject, catchError, Observable, of, switchMap, tap, throwError} from 'rxjs';
import {AuthResponse} from '../../models/auth/AuthResponse';
import {BYPASS_TOKEN_INTERCEPTOR} from '../../contexts/http-context';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient)
  private router = inject(Router)
  private authUrl = 'http://localhost:8080/api'

  public currentUser = signal<UsuarioResponse | null>(null)
  public isLoggedIn = computed(() => this.currentUser() !== null)

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor() {
    console.log('AuthService instanciado.');
  }

  init(): Observable<any> {
    const token = this.getAccessToken();
    if (token) {
      return this.fetchCurrentUser();
    }
    return of(null);
  }

  // Obtención del token del local storage
  getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  }

  // Obtención del token de refresco del local storage
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  login(credenciales: Credenciales): Observable<UsuarioResponse | null> {
    return this.http.post<AuthResponse>(`${this.authUrl}/auth/login`, credenciales).pipe(
      tap(response => this.saveTokens(response)),
      switchMap(() => this.fetchCurrentUser()),
      catchError((error: HttpErrorResponse) => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  fetchCurrentUser(): Observable<UsuarioResponse | null> {
    return this.http.get<UsuarioResponse>(`${this.authUrl}/usuarios/me`).pipe(
      tap(user => this.currentUser.set(user)),
      catchError(() => {
        return of(null);
      })
    );
  }

  logout(): void {
    const context = new HttpContext().set(BYPASS_TOKEN_INTERCEPTOR, true);
    const accessToken = this.getAccessToken();

    let headers = new HttpHeaders();
    if (accessToken) {
      headers = headers.set('Authorization', `Bearer ${accessToken}`);
    }

    this.http.post(`${this.authUrl}/auth/logout`, {}, {context, headers}).pipe(
      catchError(err => {
        console.error('Error al cerrar sesión en el backend, continuando con el logout local.', err);
        return of(null);
      })
    ).subscribe(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      this.currentUser.set(null);
      this.router.navigate(['/login']).then(r => r);
    });
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No hay token de refresco válido'));
    }

    const headers = new HttpHeaders({'Authorization': `Bearer ${refreshToken}`});
    const context = new HttpContext().set(BYPASS_TOKEN_INTERCEPTOR, true);

    return this.http.post<AuthResponse>(`${this.authUrl}/auth/refresh`, {}, { headers, context }).pipe(
      tap((tokens: AuthResponse) => {
        this.saveTokens(tokens);
      })
    );
  }

  private saveTokens(response: AuthResponse): void {
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
  }

  getIsRefreshing() {
    return this.isRefreshing;
  }

  setIsRefreshing(isRefreshing: boolean) {
    this.isRefreshing = isRefreshing;
  }

  getRefreshTokenSubject() {
    return this.refreshTokenSubject;
  }

}
