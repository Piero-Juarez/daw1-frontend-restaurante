import { Routes } from '@angular/router';
import {Login} from './pages/login/login';
import {Home} from './pages/home/home';
import {authGuard} from './core/guards/auth.guard';
import {Welcome} from './shared/components/home/welcome/welcome';
import {userSessionResolver} from './core/resolvers/user-session.resolver';
import {Ajustes} from './pages/ajustes/ajustes';
import {Usuarios} from './pages/ajustes/sub-pages/usuarios/usuarios';
import {Categorias} from './pages/ajustes/sub-pages/categorias/categorias';
import {Mesas} from './pages/ajustes/sub-pages/mesas/mesas';
import {Menu} from './pages/menu/menu';
import {Ordenes} from './pages/ordenes/ordenes';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: 'inicio',
    component: Home,
    canActivate: [authGuard],
    resolve: {
      user: userSessionResolver
    },
    children: [
      { path: '', redirectTo: 'bienvenida', pathMatch: "full" },
      { path: 'bienvenida', component: Welcome },
      { path: 'menu', component: Menu },
      { path: 'ordenes', component: Ordenes },
      {
        path: 'ajustes',
        component: Ajustes,
        children: [
          { path: 'usuarios', component: Usuarios },
          { path: 'categorias', component: Categorias },
          { path: 'mesas', component: Mesas },
          { path: '', redirectTo: 'usuarios', pathMatch: "full" }
        ]
      }
    ]
  },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' }
];
