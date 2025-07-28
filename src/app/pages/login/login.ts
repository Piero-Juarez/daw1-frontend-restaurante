import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from '../../core/services/auth/auth.service';
import {Router} from '@angular/router';
import {Credenciales} from '../../core/models/Credenciales';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {

  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage: string | null = null;

  loginForm = this.formBuilder.group({
    correo: ['', [Validators.required]],
    clave: ['', [Validators.required]]
  })

  onSubmit(): void {
    if (this.loginForm.valid) {
      const credenciales = this.loginForm.getRawValue() as Credenciales;
      this.authService.login(credenciales).subscribe({
        next: (usuario) => {
          if (usuario) { this.router.navigate(['/home']) }
          else { this.errorMessage = 'No se pudo completar el inicio de sesión.'; }
        },
        error: (err) => {
          this.errorMessage = 'Correo o contraseña incorrectos.';
          console.log('Error de login:', err);
        }
      });
    }
  }

}
