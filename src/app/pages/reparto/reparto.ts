import {Component, OnDestroy, OnInit, signal} from '@angular/core';
import {OrdenService} from '../../core/services/orden/orden.service';
import {WebsocketService} from '../../core/websocket/websocket.service';
import {OrdenResponseDTO} from '../../core/models/orden/OrdenResponseDTO';
import {Subscription} from 'rxjs';
import {OrdenCambiarEstadoRequestDTO} from '../../core/models/orden/OrdenCambiarEstadoRequestDTO';

@Component({
  selector: 'reparto',
  standalone: true,
  templateUrl: './reparto.html',
  styleUrl: './reparto.css'
})
export class Reparto implements OnInit, OnDestroy {

  constructor(
    private ordenService: OrdenService,
    private websocketService: WebsocketService
  ) {}

  ordenesParaRepartir = signal<OrdenResponseDTO[]>([]);
  private subscription = new Subscription;

  ngOnInit(): void {
    this.cargarOrdenesParaRepartir();
    this.suscribirseACambios();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  cargarOrdenesParaRepartir(): void {
    const estados = ['COMPLETADA', 'EN_REPARTO'];
    this.ordenService.obtenerOrdenesDelDia(0, 50, estados).subscribe(response => {
      this.ordenesParaRepartir.set(response.content);
    });
  }

  suscribirseACambios(): void {
    this.subscription = this.websocketService.subscribe<OrdenResponseDTO>('/topic/ordenes/cambio-estado')
      .subscribe(ordenActualizada => {
        const nuevoEstado = ordenActualizada.estado_orden.toUpperCase();
        if (nuevoEstado === 'ENTREGADA' || nuevoEstado === 'CANCELADA') {
          this.ordenesParaRepartir.update(current => current.filter(o => o.id !== ordenActualizada.id));
          return;
        }
        this.ordenesParaRepartir.update(current => {
          const index = current.findIndex(o => o.id === ordenActualizada.id);
          if (index !== -1) {
            current[index] = ordenActualizada;
            return [...current];
          } else {
            if (nuevoEstado === 'COMPLETADA') {
              return [...current, ordenActualizada];
            }
          }
          return current;
        });
      });
  }

  manejarClickOrden(orden: OrdenResponseDTO): void {
    const estadoActual = orden.estado_orden.toUpperCase();
    let proximoEstado = '';
    if (estadoActual === 'COMPLETADA') {
      proximoEstado = 'EN_REPARTO';
    } else if (estadoActual === 'EN_REPARTO') {
      proximoEstado = 'ENTREGADA';
    } else {
      return;
    }
    const cambio: OrdenCambiarEstadoRequestDTO = { estado_orden: proximoEstado }
    this.ordenService.cambiarEstadoOrden(orden.id, cambio).subscribe();
  }

}
