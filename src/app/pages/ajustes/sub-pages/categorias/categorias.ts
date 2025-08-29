import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {CategoriaService} from '../../../../core/services/categoria/categoria.service';
import {WebsocketService} from '../../../../core/websocket/websocket.service';
import {CategoriaResponse} from '../../../../core/models/categoria/CategoriaResponse';
import {Subscription} from 'rxjs';
import {CategoriaRequest} from '../../../../core/models/categoria/CategoriaRequest';
import {Modal} from '../../../../shared/components/ajustes/modal/modal';
import {CurrencyPipe} from '@angular/common';

@Component({
  selector: 'ajustes-categorias',
  standalone: true,
  templateUrl: './categorias.html',
  imports: [
    Modal,
    ReactiveFormsModule,
    CurrencyPipe
  ],
  styleUrls: ['./categorias.css', '../sub-pages.css']
})
export class Categorias implements OnInit, OnDestroy {

  private formBuilder = inject(FormBuilder);
  private categoriaService = inject(CategoriaService);
  private webSocketService = inject(WebsocketService);

  categorias = signal<CategoriaResponse[]>([]);
  categoriaSeleccionada = signal<CategoriaResponse | null>(null)
  private subscripcion = new Subscription();

  modalEliminarVisible = false;
  modalCrearEditarVisible = false;

  categoriaForm = this.formBuilder.group({
    nombre: ['', [Validators.required]],
    descripcion: ['', [Validators.required, Validators.maxLength(150)]],
    precio_minimo: [0, [Validators.required]]
  })

  ngOnInit(): void {
    this.cargarCategorias();
    this.suscribirseACambios();
  }

  ngOnDestroy(): void {
    this.subscripcion.unsubscribe();
  }

  suscribirseACambios(): void {
    const actualizacionCategoria = this.webSocketService.subscribe<CategoriaResponse>('/topic/categorias')
      .subscribe(categoriaActualizada => {
        this.categorias.update(current => {
          const index = current.findIndex(c => c.id === categoriaActualizada.id);
          if (index !== -1) {
            current[index] = categoriaActualizada;
            return [...current];
          } else {
            return [...current, categoriaActualizada];
          }
        });
      })

    const eliminacionCategoria = this.webSocketService.subscribe<number>('/topic/categorias/eliminado')
      .subscribe(idCategoriaEliminada => {
        this.categorias.update(current => current.filter(c => c.id !== idCategoriaEliminada));
      });

    this.subscripcion.add(actualizacionCategoria);
    this.subscripcion.add(eliminacionCategoria);
  }

  cargarCategorias(): void {
    this.categoriaService.obtenerCategorias().subscribe({
      next: (data) => this.categorias.set(data),
      error: (err) => console.log('Error al cargar categorias:', err)
    });
  }

  abrirModalCrearEditar(categoria?: CategoriaResponse): void {
    if (categoria) {
      this.categoriaSeleccionada.set(categoria);
      this.categoriaForm.patchValue({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        precio_minimo: categoria.precio_minimo
      });
    } else {
      this.categoriaSeleccionada.set(null);
      this.categoriaForm.reset();
    }
    this.modalCrearEditarVisible = true;
  }
  confirmarCrearEditar(): void {
    if (this.categoriaForm.invalid) { return; }
    const categoriaEditada = this.categoriaSeleccionada();
    if (categoriaEditada) {
      const datosActualizados: Partial<CategoriaRequest> = {
        nombre: this.categoriaForm.value.nombre!,
        descripcion: this.categoriaForm.value.descripcion!,
        precio_minimo: this.categoriaForm.value.precio_minimo!
      }
      this.categoriaService.actualizarCategoria(categoriaEditada.id!, datosActualizados as CategoriaRequest).subscribe({
        next: () => this.cerrarModalCrearEditar(),
        error: (err) => console.log('Error al actualizar categoria:', err)
      });
    } else {
      const nuevaCategoria: CategoriaRequest = this.categoriaForm.getRawValue() as CategoriaRequest;
      this.categoriaService.crearCategoria(nuevaCategoria).subscribe({
        next: () => this.cerrarModalCrearEditar(),
        error: (err) => console.log('Error al crear categoria:', err)
      });
    }
  }
  cerrarModalCrearEditar(): void {
    this.limpiarFormulario();
    this.modalCrearEditarVisible = false;
  }

  abrirModalEliminar(categoria: CategoriaResponse): void {
    this.categoriaSeleccionada.set(categoria);
    this.modalEliminarVisible = true;
  }
  confirmarEliminacion(): void {
    const idParaEliminar: number = this.categoriaSeleccionada()?.id!;
    if (idParaEliminar !== 0) {
      this.categoriaService.eliminarCategoria(idParaEliminar).subscribe({
        next: () => this.cerrarModalEliminar(),
        error: (err) => console.log('Error al eliminar categoria:', err)
      });
    }
  }
  cerrarModalEliminar(): void {
    this.limpiarFormulario();
    this.modalEliminarVisible = false;
  }

  limpiarFormulario(): void {
    this.categoriaSeleccionada.set(null);
    this.categoriaForm.reset();
  }

}
