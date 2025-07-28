import { Routes } from '@angular/router';
import {Login} from './pages/login/login';
import {Home} from './pages/home/home';
import {authGuard} from './core/guards/auth.guard';
import {Welcome} from './shared/components/home/welcome/welcome';
import {userSessionResolver} from './core/resolvers/user-session.resolver';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: 'home',
    component: Home,
    canActivate: [authGuard],
    resolve: {
      user: userSessionResolver
    },
    children: [
      { path: '', redirectTo: 'welcome', pathMatch: "full" },
      { path: 'welcome', component: Welcome }
    ]
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' }
];
