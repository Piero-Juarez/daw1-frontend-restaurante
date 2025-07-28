import {Component, inject, signal} from '@angular/core';
import {AuthService} from '../../core/services/auth/auth.service';
import {RouterLinkActive, RouterOutlet} from '@angular/router';
import {listadoMenu, MenuItem} from './models/MenuItem';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, RouterLinkActive],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  readonly menuItem = signal<MenuItem[]>(listadoMenu());
  authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }

}
