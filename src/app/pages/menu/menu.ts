import {Component, ElementRef, OnDestroy, OnInit, signal, ViewChild} from '@angular/core';
import {ItemMenuResponse} from '../../core/models/menu/ItemMenuResponse';
import {MenuService} from '../../core/services/menu/menu.service';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {CategoriaResponse} from '../../core/models/categoria/CategoriaResponse';
import {CategoriaService} from '../../core/services/categoria/categoria.service';
import {WebsocketService} from '../../core/websocket/websocket.service';
import {Subscription} from 'rxjs';
import {EstadoItemMenuRequest} from '../../core/models/menu/EstadoItemMenuRequest';
import {Modal} from '../../shared/components/ajustes/modal/modal';
import {fileTypeValidators} from '../../core/validators/file-type.validators';
import {ItemMenuRequest} from '../../core/models/menu/ItemMenuRequest';
import {ImgbbService} from '../../core/services/imgbb/imgbb.service';
import {CurrencyPipe} from '@angular/common';

@Component({
  selector: 'menu',
  standalone: true,
  templateUrl: './menu.html',
  imports: [
    FormsModule,
    Modal,
    ReactiveFormsModule,
    CurrencyPipe
  ],
  styleUrls: ['./menu.css']
})
export class Menu implements OnInit, OnDestroy {

  constructor(
    private readonly menuService: MenuService,
    private readonly categoryService: CategoriaService,
    private readonly webSocketService: WebsocketService,
    private readonly imgbbService: ImgbbService
  ) {}

  categorias = signal<CategoriaResponse[]>([]);

  items = signal<ItemMenuResponse[]>([]);
  itemSeleccionado = signal<ItemMenuResponse | null>(null);
  montoIgv = signal<number>(0);
  currentPage: number = 0;
  totalPages: number = 0;
  totalElements: number = 0;
  pageSize: number = 8;
  pageNumbers: (number | '...')[] = [];

  buscarPorNombre: string = '';
  buscarPorCategoria: string = '';

  modalCrearEditarVisible = false;
  modalEliminarVisible = false;

  private subscription: Subscription = new Subscription()
  //private readonly formBuilder = inject(FormBuilder)

  @ViewChild('fileInput') fileInput?: ElementRef;
  private readonly allowedImageTypes = ['image/jpeg', 'image/jpeg', 'image/webp'];

  itemForm = new FormGroup({
    nombre: new FormControl<string>('', {
      nonNullable: true,
      validators: Validators.required
    }),
    descripcion: new FormControl<string | null>(''),
    precio: new FormControl<number>(0, {
      nonNullable: true,
      validators: Validators.required
    }),
    imagen: new FormControl<File | null>(null, {
      validators: [
        Validators.required,
        fileTypeValidators(this.allowedImageTypes)
      ]
    }),
    idCategoria: new FormControl<number>(0, {
      nonNullable: true,
      validators: Validators.required
    }),
    estado: new FormControl<string>('DISPONIBLE', {
      nonNullable: true
    })
  });

  ngOnInit() {
    this.cargarDatos();
    this.suscribirseACambios();

    const precioSubscripcionCambios = this.itemForm.get('precio')?.valueChanges.subscribe(nuevoPrecio => {
      const precioNumerico = Number(nuevoPrecio) || 0;
      const montoIgv = (precioNumerico / 1.18) * 0.18;
      this.montoIgv.set(montoIgv);
    });

    if (precioSubscripcionCambios) {
      this.subscription.add(precioSubscripcionCambios);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  suscribirseACambios(): void {
    const itemAgregado = this.webSocketService.subscribe<ItemMenuResponse>('/topic/items-menu/guardado')
      .subscribe(itemAgregado => {
        this.items.update(current => {
          const index = current.findIndex(i => i.id === itemAgregado.id);
          if (index !== -1) {
            current[index] = itemAgregado;
            return [...current];
          } else {
            return [...current, itemAgregado];
          }
        });
      });

    const itemActualizado = this.webSocketService.subscribe<ItemMenuResponse>('/topic/items-menu/editado')
      .subscribe(itemActualizado => {
        this.items.update(current => {
          const index = current.findIndex(i => i.id === itemActualizado.id);
          if (index !== -1) {
            current[index] = itemActualizado;
            return [...current];
          } else {
            return [...current, itemActualizado];
          }
        });
      });

    const actualizacionEstadoItem = this.webSocketService.subscribe<ItemMenuResponse>('/topic/items-menu/cambio-estado')
      .subscribe(estadoItemActualizado => {
        this.items.update(current => {
          const index = current.findIndex(i => i.id === estadoItemActualizado.id);
          if (index !== -1) {
            current[index] = estadoItemActualizado;
            return [...current];
          } else {
            return [...current, estadoItemActualizado];
          }
        });
      });

    const eliminacionItem = this.webSocketService.subscribe<number>('/topic/items-menu/eliminado')
      .subscribe(idItemEliminado => {
        this.items.update(current => current.filter(i => i.id !== idItemEliminado));
      });

    this.subscription.add(itemAgregado);
    this.subscription.add(itemActualizado);
    this.subscription.add(actualizacionEstadoItem);
    this.subscription.add(eliminacionItem);
  }

  cargarDatos(page: number = 0): void {
    const terminosDeBusqueda = this.buscarPorNombre || this.buscarPorCategoria;
    const datoObservable = terminosDeBusqueda
      ? this.menuService.buscarItemsMenu(this.buscarPorNombre, this.buscarPorCategoria, page, this.pageSize)
      : this.menuService.obtenerItemsMenu(page, this.pageSize);
    datoObservable.subscribe(response => {
      this.items.set(response.content);
      this.currentPage = response.page.number;
      this.totalPages = response.page.totalPages;
      this.totalElements = response.page.totalElements;

      // ACTUALIZAR LA PAGINACIÓN
      this.actualizarPaginado();
    });
    this.categoryService.obtenerCategorias().subscribe(suscribe => {
      this.categorias.set(suscribe);
    });
  }

  onBuscar(): void {
    this.cargarDatos(0);
  }

  seleccionarCategoria(nombreCategoria: string): void {
    this.buscarPorCategoria = nombreCategoria;
    this.cargarDatos(0);
  }

  limpiarFiltroCategoria(): void {
    this.buscarPorCategoria = '';
    this.cargarDatos(0);
  }

  limpiarBusqueda(): void {
    this.buscarPorNombre = '';
    this.cargarDatos(0);
  }

  private actualizarPaginado(): void {
    if (this.totalPages <= 7) {
      this.pageNumbers = Array.from({length: this.totalPages}, (_, i) => i + 1);
    } else {
      const firstPage = 1;
      const lastPage = this.totalPages;
      const currentPageNum = this.currentPage + 1;

      if (currentPageNum <= 4) {
        this.pageNumbers = [1, 2, 3, 4, 5, '...', lastPage];
      } else if (currentPageNum >= this.totalPages - 3) {
        this.pageNumbers = [firstPage, '...', lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage]
      } else {
        this.pageNumbers = [firstPage, '...', currentPageNum - 1, currentPageNum, currentPageNum + 1, '...', lastPage];
      }
    }
  }

  cambiarEstado(id: number, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const estado = selectElement.value;
    const estadoItemMenuRequest: EstadoItemMenuRequest = {
      estado: estado
    }

    this.menuService.actualizarEstadoItemMenu(id, estadoItemMenuRequest).subscribe({
      error: (err) => console.log('Error al actualizar estado del item:', err)
    });

  }

  abrirModalCrearEditar(item?: ItemMenuResponse): void {
    const imagenControl = this.itemForm.get('imagen');
    if (item) {
      this.itemSeleccionado.set(item);
      imagenControl?.clearValidators();
      this.itemForm.patchValue({
        nombre: item.nombre,
        descripcion: item.descripcion,
        precio: item.precio,
        idCategoria: item.categoria.id,
        estado: item.estado
      });
      this.montoIgv.set((item.precio / 1.18) * 0.18);
    } else {
      this.itemSeleccionado.set(null);
      this.itemForm.reset({
        idCategoria: 1
      });
      this.montoIgv.set(0);
      imagenControl?.setValidators([
        Validators.required,
        fileTypeValidators(this.allowedImageTypes)
      ]);
    }
    imagenControl?.updateValueAndValidity();
    this.modalCrearEditarVisible = true;
  }
  confirmarCrearEditar(): void {
    if (this.itemForm.invalid) { return; }
    const imagenFile = this.itemForm.get('imagen')?.value;
    if (imagenFile) {
      this.imgbbService.subirImagen(imagenFile).subscribe({
        next: (imgbbResponse) => {
          if (imgbbResponse.success) {
            const enlaceImagenDesdeImgbb = imgbbResponse.data.url;
            this._realizarGuardado(enlaceImagenDesdeImgbb);
          }
        },
        error: (err) => console.log('Error al subir la imagen a ImgBB:', err)
      });
    } else {
      const enlaceImagenOriginal = this.itemSeleccionado()?.enlace_imagen || '';
      this._realizarGuardado(enlaceImagenOriginal);
    }
  }
  cerrarModalCrearEditar() {
    this.limpiarFormulario();
    this.modalCrearEditarVisible = false;
  }

  private _realizarGuardado(enlaceImagen: string): void {
    const itemEditado = this.itemSeleccionado();
    const datosFormulario: ItemMenuRequest = {
      nombre: this.itemForm.value.nombre!,
      descripcion: this.itemForm.value.descripcion!,
      precio: this.itemForm.value.precio!,
      enlace_imagen: enlaceImagen,
      id_categoria: this.itemForm.value.idCategoria!,
      estado: this.itemForm.value.estado!
    }
    if (itemEditado) {
      this.menuService.actualizarItemMenu(itemEditado.id!, datosFormulario).subscribe({
        next: () => this.cerrarModalCrearEditar(),
        error: (err) => console.log('Error al actualizar item:', err)
      })
    } else {
      this.menuService.crearItemMenu(datosFormulario).subscribe({
        next: () => this.cerrarModalCrearEditar(),
        error: (err) => console.log('Error al crear item:', err)
      })
    }
  }

  abrirModalEliminar(item: ItemMenuResponse): void {
    this.itemSeleccionado.set(item);
    this.modalEliminarVisible = true;
  }
  confirmarEliminacion() {
    const idParaEliminar: number = this.itemSeleccionado()?.id!;
    if (idParaEliminar !== 0) {
      this.menuService.eliminarItemMenu(idParaEliminar).subscribe({
        next: () => this.cerrarModalEliminar(),
        error: (err) => console.log('Error al eliminar item:', err)
      });
    }
  }
  cerrarModalEliminar(): void {
    this.limpiarFormulario();
    this.modalEliminarVisible = false;
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.itemForm.patchValue({
        imagen: file
      });
      this.itemForm.get('imagen')?.markAsTouched();
    }
  }

  limpiarFormulario(): void {
    this.itemSeleccionado.set(null);
    this.itemForm.reset();
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

}
