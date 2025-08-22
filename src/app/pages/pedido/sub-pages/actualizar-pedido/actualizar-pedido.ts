import {Component, computed, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {Router} from '@angular/router';
import {MesaService} from '../../../../core/services/mesa/mesa.service';
import {MenuService} from '../../../../core/services/menu/menu.service';
import {CategoriaService} from '../../../../core/services/categoria/categoria.service';
import {OrdenService} from '../../../../core/services/orden/orden.service';
import {WebsocketService} from '../../../../core/websocket/websocket.service';
import {MesaResponse} from '../../../../core/models/mesa/MesaResponse';
import {ItemMenuResponse} from '../../../../core/models/menu/ItemMenuResponse';
import {CategoriaResponse} from '../../../../core/models/categoria/CategoriaResponse';
import {CarritoItem} from '../../../../core/models/carrito/CarritoItem';
import {Subscription} from 'rxjs';
import {OrdenResponseDTO} from '../../../../core/models/orden/OrdenResponseDTO';
import {DetalleOrdenRequestDTO} from '../../../../core/models/detalleorden/DetalleOrdenRequestDTO';
import {OrdenRequestDTO} from '../../../../core/models/orden/OrdenRequestDTO';
import {CurrencyPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Modal} from '../../../../shared/components/ajustes/modal/modal';

@Component({
  selector: 'actualizar-pedido',
  standalone: true,
  templateUrl: './actualizar-pedido.html',
  imports: [
    CurrencyPipe,
    FormsModule,
    Modal
  ],
  styleUrls: ['./actualizar-pedido.css']
})
export class ActualizarPedido implements OnInit, OnDestroy {

  private router = inject(Router)
  private mesaService = inject(MesaService);
  private menuService = inject(MenuService);
  private categoriaService = inject(CategoriaService);
  private ordenService = inject(OrdenService);
  private webSocketService = inject(WebsocketService);

  public mesas = signal<MesaResponse[]>([]);
  public items = signal<ItemMenuResponse[]>([]);
  public categorias = signal<CategoriaResponse[]>([]);

  public mesaSeleccionada = signal<MesaResponse | null>(null);
  public carrito = signal<CarritoItem[]>([]);
  public idOrden = signal<number>(0);

  public totalOrden = computed(() => {
    return this.carrito().reduce((total, item) => total + item.subtotal, 0);
  });

  mostrarMensajeAviso = false;

  buscarPorCategoria: string = '';
  currentPage: number = 0;
  totalPages: number = 0;
  totalElements: number = 0;
  pageSize: number = 8;
  pageNumbers: (number | '...')[] = [];

  private subscription: Subscription = new Subscription()

  ngOnInit(): void {
    this.suscribirseACambios();
    this.cargarMesas();
    this.cargarItems();
    this.cargarCategorias();
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
        if (estadoItemActualizado.estado === 'Deshabilitado') {
          this.carrito.update(currentCarrito => {
            if (currentCarrito.some(item => item.id === estadoItemActualizado.id)) {
              return currentCarrito.filter(item => item.id !== estadoItemActualizado.id);
            }
            return currentCarrito;
          })
        }
      });

    const eliminacionItem = this.webSocketService.subscribe<number>('/topic/items-menu/eliminado')
      .subscribe(idItemEliminado => {
        this.items.update(current => current.filter(i => i.id !== idItemEliminado));
      });

    const actualizacionEstadoMesa = this.webSocketService.subscribe<MesaResponse>('/topic/mesas/estado')
      .subscribe(mesaActualizada => {
        this.mesas.update(current => {
          const index = current.findIndex(m => m.id === mesaActualizada.id);
          if (index !== -1) {
            current[index] = mesaActualizada;
            return [...current];
          } else {
            return [...current, mesaActualizada];
          }
        });
      });

    const actualizacionEstadoOrden = this.webSocketService.subscribe<OrdenResponseDTO>('/topic/ordenes/cambio-estado')
      .subscribe(ordenActualizada => {
        if (ordenActualizada.estado_orden.toUpperCase() !== 'PENDIENTE') {
          this.mesas.update(currentMesas =>
            currentMesas.filter(mesa => mesa.id !== ordenActualizada.mesa_id)
          );
          if (this.mesaSeleccionada()?.id === ordenActualizada.mesa_id) {
            this.mostrarMensajeDeAviso();
          }
        }
      });

    this.subscription.add(itemAgregado);
    this.subscription.add(itemActualizado);
    this.subscription.add(actualizacionEstadoItem);
    this.subscription.add(eliminacionItem);
    this.subscription.add(actualizacionEstadoMesa);
    this.subscription.add(actualizacionEstadoOrden);
  }

  mostrarMensajeDeAviso(): void {
    this.mostrarMensajeAviso = true;
  }
  cerrarMensajeDeAviso(): void {
    this.borrarDatos();
    this.volverAtras()
    this.mostrarMensajeAviso = false;
  }

  cargarMesas(): void {
    this.mesaService.obtenerMesasConOrdenPendiente().subscribe({
      next: (data) => this.mesas.set(data),
      error: (err) => console.log('Error al cargar mesas con orden pendiente:', err)
    });
  }

  cargarCategorias(): void {
    this.categoriaService.obtenerCategorias().subscribe({
      next: (data) => this.categorias.set(data),
      error: (err) => console.log('Error al cargar categorias:', err)
    })
  }

  cargarItems(page: number = 0): void {
    this.menuService.buscarItemsMenu('', this.buscarPorCategoria, page, this.pageSize)
      .subscribe(response => {
        this.items.set(response.content);
        this.currentPage = response.page.number;
        this.totalPages = response.page.totalPages;
        this.totalElements = response.page.totalElements;
        this.actualizarPaginado();
      });
  }

  seleccionarCategoria(nombreCategoria: string): void {
    this.buscarPorCategoria = nombreCategoria;
    this.cargarItems(0);
  }

  seleccionarMesa(mesa: MesaResponse) {
    this.mesaSeleccionada.set(mesa);
    this.ordenService.obtenerOrdenPendientePorIdMesa(mesa.id).subscribe({
      next: (data) => this.idOrden.set(data.id),
      error: (err) => console.log('Error al cargar orden:', err)
    })
  }

  crearOrden(): void {
    const mesaId = this.mesaSeleccionada()?.id;
    if (!mesaId) { return; }
    if (this.carrito().length === 0) { return; }

    const detalles: DetalleOrdenRequestDTO[] = this.carrito().map(item => ({
      item_menu_id: item.id,
      cantidad: item.cantidad
    }));
    const nuevaOrden: OrdenRequestDTO = {
      mesa_id: mesaId,
      detalles: detalles
    }

    this.ordenService.actualizarOrden(this.idOrden(), nuevaOrden).subscribe({
      next: () => {
        this.volverAtras();
      },
      error: (err) => console.log('Error al crear orden:', err)
    })
  }

  volverAtras() {
    this.borrarDatos();
    void this.router.navigate(['/inicio/pedido']);
  }

  private borrarDatos() {
    this.mesaSeleccionada.set(null);
    this.carrito.set([]);
    this.buscarPorCategoria = '';
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

  cambiarMesa(): void {
    this.borrarDatos()
  }

  agregarItem(itemMenu: ItemMenuResponse) {
    this.carrito.update(carritoActual => {
      const itemExistente = carritoActual.find(item => item.id === itemMenu.id);
      if (itemExistente) {
        return carritoActual.map(item => item.id === itemMenu.id ? { ...item, cantidad: item.cantidad + 1, subtotal: item.precio * (item.cantidad + 1)} : item)
      } else {
        const nuevoItem: CarritoItem = {
          id: itemMenu.id,
          nombre: itemMenu.nombre,
          precio: itemMenu.precio,
          cantidad: 1,
          subtotal: itemMenu.precio
        };
        return [...carritoActual, nuevoItem];
      }
    });
  }

  eliminarItem(itemId: number) {
    this.carrito.update(carritoActual => {
      return carritoActual.filter(item => item.id !== itemId);
    });
  }
}
