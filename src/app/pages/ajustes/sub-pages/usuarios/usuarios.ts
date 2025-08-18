import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {UsuarioService} from '../../../../core/services/usuario/usuario.service';
import {UsuarioResponse} from '../../../../core/models/usuario/UsuarioResponse';
import {Modal} from '../../../../shared/components/ajustes/modal/modal';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {UsuarioRequest} from '../../../../core/models/usuario/UsuarioRequest';
import {WebsocketService} from '../../../../core/websocket/websocket.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'ajustes-usuarios',
  standalone: true,
  templateUrl: './usuarios.html',
  imports: [
    Modal,
    ReactiveFormsModule
  ],
  styleUrls: ['./usuarios.css', '../sub-pages.css']
})
export class Usuarios implements OnInit, OnDestroy {

  private formBuilder = inject(FormBuilder)
  private usuarioService = inject(UsuarioService);
  private webSocketService = inject(WebsocketService)

  usuarios = signal<UsuarioResponse[]>([]);
  usuarioSeleccionado = signal<UsuarioResponse | null>(null);
  private subscriptions = new Subscription();

  modalEliminarVisible = false;
  modalCrearEditarVisible = false;

  usuarioForm = this.formBuilder.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    clave: ['CAMARERO'],
    rol: ['', Validators.required]
  })

  ngOnInit(): void {
    this.cargarUsuariosActivos();
    this.suscribirseACambios();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  suscribirseACambios(): void {
    // Tópico para creación y edición de usuarios
    const actualizacionUsuario = this.webSocketService.subscribe<UsuarioResponse>('/topic/usuarios')
      .subscribe(usuarioActualizado => {
        this.usuarios.update(current => {
          const index = current.findIndex(u => u.id === usuarioActualizado.id);
          if (index !== -1) {
            current[index] = usuarioActualizado;
            return [...current];
          } else {
            return [...current, usuarioActualizado];
          }
        });
      });

    // Tópico para eliminación de usuarios
    const eliminacionUsuario = this.webSocketService.subscribe<number>('/topic/usuarios/eliminado')
      .subscribe(idUsuarioEliminado => {
        this.usuarios.update(current => current.filter(u => u.id !== idUsuarioEliminado));
      });

    this.subscriptions.add(actualizacionUsuario);
    this.subscriptions.add(eliminacionUsuario);
  }

  /* PETICIONES API */
  cargarUsuariosActivos(): void {
    this.usuarioService.obtenerUsuariosActivos().subscribe({
      next: (data) => this.usuarios.set(data),
      error: (err) => console.log('Error al cargar usuarios:', err)
    });
  }
  eliminarUsuario(id: number): void {
    this.usuarioService.eliminarUsuario(id).subscribe({
      error: (err) => console.log('Error al eliminar usuario:', err)
    });
  }
  crearUsuario(usuario: UsuarioRequest): void {
    this.usuarioService.crearUsuario(usuario).subscribe({
      error: (err) => console.log('Error al crear usuario:', err)
    });
  }
  actualizarUsuario(id: number, usuario: UsuarioRequest): void {
    this.usuarioService.actualizarUsuario(id, usuario).subscribe({
      error: (err) => console.log('Error al actualizar usuario:', err)
    });
  }
  /* FIN PETICIONES API */

  // MODAL CREAR / EDITAR
  abrirModalCrearEditar(usuario?: UsuarioResponse): void {
    if (usuario) {
      this.usuarioSeleccionado.set(usuario);
      this.usuarioForm.patchValue({
        nombre: usuario!.nombre,
        apellido: usuario!.apellido,
        correo: usuario!.correo,
        rol: usuario!.rol.toUpperCase()
      });
      this.usuarioForm.get('clave')?.clearValidators();
      this.usuarioForm.get('clave')?.updateValueAndValidity();
    } else {
      this.usuarioSeleccionado.set(null);
      this.usuarioForm.reset({
        nombre: '',
        apellido: '',
        correo: '',
        clave: '',
        rol: 'CAMARERO'
      });
      this.usuarioForm.get('clave')?.setValidators([Validators.required]);
      this.usuarioForm.get('clave')?.updateValueAndValidity();
    }
    this.modalCrearEditarVisible = true;
  }
  confirmarCrearEditar(): void {
    if (this.usuarioForm.invalid) {
      return;
    }

    const usuarioEditado = this.usuarioSeleccionado;

    if (usuarioEditado()) {
      const datosActualizados: Partial<UsuarioRequest> = {
        nombre: this.usuarioForm.value.nombre!,
        apellido: this.usuarioForm.value.apellido!,
        correo: this.usuarioForm.value.correo!,
        clave: this.usuarioForm.value.clave!,
        rol: this.usuarioForm.value.rol!
      }
      this.actualizarUsuario(usuarioEditado()?.id!, datosActualizados as UsuarioRequest);
    } else {
      const nuevoUsuario: UsuarioRequest = this.usuarioForm.getRawValue() as UsuarioRequest;
      this.crearUsuario(nuevoUsuario);
    }

    this.cerrarModalEditar();
  }
  cerrarModalEditar(): void {
    this.limpiarFormulario();
    this.modalCrearEditarVisible = false;
  }

  // MODAL ELIMINAR
  abrirModalEliminar(usuario: UsuarioResponse): void {
    this.usuarioSeleccionado.set(usuario);
    this.modalEliminarVisible = true;
  }
  confirmarEliminacion(): void {
    const idParaEliminar = this.usuarioSeleccionado()?.id!;
    if (idParaEliminar !== 0) {
      this.eliminarUsuario(idParaEliminar);
    }

    this.cerrarModalEliminar();
  }
  cerrarModalEliminar(): void {
    this.limpiarFormulario();
    this.modalEliminarVisible = false;
  }

  limpiarFormulario(): void {
    this.usuarioSeleccionado.set(null);
    this.usuarioForm.reset();
    //this.idUsuario.set(0);
    this.usuarioForm.get('clave')?.clearValidators();
    this.usuarioForm.get('clave')?.updateValueAndValidity();
  }

}
