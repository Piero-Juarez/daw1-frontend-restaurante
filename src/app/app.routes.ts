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
import {Pedido} from './pages/pedido/pedido';
import {OpcionesPedido} from './pages/pedido/sub-pages/opciones-pedidos/opciones-pedido';
import {NuevoPedido} from './pages/pedido/sub-pages/nuevo-pedido/nuevo-pedido';
import {ActualizarPedido} from './pages/pedido/sub-pages/actualizar-pedido/actualizar-pedido';

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
        path: 'pedido',
        component: Pedido,
        children: [
          { path: '', component: OpcionesPedido },
          { path: 'nuevo', component: NuevoPedido },
          { path: 'actualizar', component: ActualizarPedido }
        ]
      },
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
