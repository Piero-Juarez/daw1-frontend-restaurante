import {Component, computed, inject, Signal, signal} from '@angular/core';
import {AuthService} from '../../core/services/auth/auth.service';
import {RouterModule, RouterOutlet} from '@angular/router';
import {listadoMenu, MenuItem} from './models/MenuItem';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  authService = inject(AuthService);
  private allMenuItems: MenuItem[] = listadoMenu();
  menuMovilAbierto = signal(false);

  menuItem: Signal<MenuItem[]> = computed(() => {
    const user = this.authService.currentUser();
    if (!user) {
      return [];
    }

    const userRol = user.rol;
    return this.allMenuItems.filter(item => {
      if (!item.roles || item.roles.length === 0) {
        return true;
      }
      return item.roles.includes(userRol);
    });
  });

  palancaMenuMovil(): void {
    this.menuMovilAbierto.update(abierto => !abierto);
  }

  cerrarMenuMovil(): void {
    this.menuMovilAbierto.set(false);
  }

  logout(): void {
    this.authService.logout();
  }

}
