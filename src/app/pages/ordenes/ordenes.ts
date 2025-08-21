import {Component, OnDestroy, OnInit, signal} from '@angular/core';
import {OrdenService} from '../../core/services/orden/orden.service';
import {WebsocketService} from '../../core/websocket/websocket.service';
import {OrdenResponseDTO} from '../../core/models/orden/OrdenResponseDTO';
import {Subscription} from 'rxjs';
import {CurrencyPipe} from '@angular/common';
import {OrdenCambiarEstadoRequestDTO} from '../../core/models/orden/OrdenCambiarEstadoRequestDTO';
import {InformacionAdicionalBoletaRequest} from '../../core/models/reporte/InformacionAdicionalBoletaRequest';
import {ReporteService} from '../../core/services/reporte/reporte.service';
import {Modal} from '../../shared/components/ajustes/modal/modal';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'ordenes',
  standalone: true,
  templateUrl: './ordenes.html',
  imports: [
    CurrencyPipe,
    Modal,
    FormsModule
  ],
  styleUrls: ['./ordenes.css']
})
export class Ordenes implements OnInit, OnDestroy {

  constructor(
    private readonly ordenService: OrdenService,
    private readonly webSocketService: WebsocketService,
    private readonly reportService: ReporteService
  ) {}

  ordenes = signal<OrdenResponseDTO[]>([]);
  ordenSeleccionada = signal<OrdenResponseDTO | null>(null);
  filtroActivo = signal<string>('PENDIENTE');

  modalGenerarBoleta: boolean = false;
  dineroCliente: number = 0;

  currentPage: number = 0;
  totalPages: number = 0;
  totalElements: number = 0;
  pageSize: number = 9;
  pageNumbers: (number | '...')[] = [];

  private subscription: Subscription = new Subscription();

  ngOnInit(): void {
    this.cargarOrdenes();
    this.suscribirseACambios();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  suscribirseACambios(): void {
    const orden = this.webSocketService.subscribe<OrdenResponseDTO>('/topic/ordenes')
      .subscribe(orden => {
        this.ordenes.update(current => {
          const index = current.findIndex(o => o.id === orden.id);
          if (index !== -1) {
            current[index] = orden;
            return [...current];
          } else {
            if (this.filtroActivo() === null || orden.estado_orden.toUpperCase() === this.filtroActivo()) {
              return [...current, orden];
            }
            return current;
          }
        });
      });

    const actualizacionEstadoOrden = this.webSocketService.subscribe<OrdenResponseDTO>('/topic/ordenes/cambio-estado')
      .subscribe(() => this.cargarOrdenes(this.currentPage));

    this.subscription.add(orden);
    this.subscription.add(actualizacionEstadoOrden);
  }

  cargarOrdenes(page: number = 0): void {
    const estado = this.filtroActivo();
    this.ordenService.obtenerOrdenesDelDia(page, this.pageSize, estado).subscribe(response => {
      this.ordenes.set(response.content);
      this.currentPage = response.page.number;
      this.totalPages = response.page.totalPages;
      this.totalElements = response.page.totalElements;

      this.actualizarPaginado();
    });
  }

  seleccionarFiltro(estado: string): void {
    this.filtroActivo.set(estado);
    this.cargarOrdenes(0);
  }

  cambiarEstado(id: number, event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const estado = selectElement.value;
    const estadoOrden: OrdenCambiarEstadoRequestDTO = {
      estado_orden: estado
    }

    this.ordenService.cambiarEstadoOrden(id, estadoOrden).subscribe({
      error: (err) => console.log('Error al cambiar estado de la orden:', err)
    })
  }

  generarYMostrarBoleta(): void {
    if (this.ordenSeleccionada() === null) {
      return;
    }
    const infoCliente: InformacionAdicionalBoletaRequest = {
      monto_pagado: this.dineroCliente
    };
    this.reportService.generarBoletaConsumo(this.ordenSeleccionada()?.id!, infoCliente).subscribe({
      next: (pdfBlob: Blob) => {
        this.abrirPdfEnNuevaPestana(pdfBlob);
        this.cerrarModalGenerarBoleta();
      },
      error: (err) => console.error('Error al generar boleta:', err)
    });
  }

  private abrirPdfEnNuevaPestana(blob: Blob): void {
    const fileURL = URL.createObjectURL(blob);
    window.open(fileURL, '_blank');
  }

  abrirModalGenerarBoleta(orden: OrdenResponseDTO): void {
    this.ordenSeleccionada.set(orden);
    this.modalGenerarBoleta = true;
  }

  cerrarModalGenerarBoleta(): void {
    this.ordenSeleccionada.set(null);
    this.dineroCliente = 0;
    this.modalGenerarBoleta = false;
  }

  cargarDatos(page: number = 0) {
    const datosObservable = this.ordenService.obtenerOrdenesDelDia(page, this.pageSize, this.filtroActivo());
    datosObservable.subscribe(response => {
      this.ordenes.set(response.content);
      this.currentPage = response.page.number;
      this.totalPages = response.page.totalPages;
      this.totalElements = response.page.totalElements;
    });
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
}
