import {Component, inject} from '@angular/core';
import {AuthService} from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'home-welcome',
  standalone: true,
  template: `
    <div class="welcome__contenedor">
      <div class="welcome__contenedor-logo">
        <img src="img/logo.svg" alt="Welcome"/>
      </div>
      <div class="welcome__contenedor-informacion">
        <h1>¡Bienvenido al sistema <br/>de Gestión Restaurante!</h1>
        <br/>
        <h2>Usuario: {{ authService.currentUser()?.nombre }} {{ authService.currentUser()?.apellido }}</h2>
        <h2>Puesto: {{ authService.currentUser()?.rol }}</h2>
      </div>
    </div>
  `,
  styleUrl: './welcome.css'
})
export class Welcome {
  public authService = inject(AuthService);
}
