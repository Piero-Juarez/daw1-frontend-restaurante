import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {WebsocketService} from '../../../../core/websocket/websocket.service';
import {Subscription} from 'rxjs';
import {MesaService} from '../../../../core/services/mesa/mesa.service';
import {MesaResponse} from '../../../../core/models/mesa/MesaResponse';
import {MesaRequest} from '../../../../core/models/mesa/MesaRequest';
import {Modal} from '../../../../shared/components/ajustes/modal/modal';

@Component({
  selector: 'ajustes-mesas',
  standalone: true,
  templateUrl: './mesas.html',
  imports: [
    Modal,
    FormsModule,
    ReactiveFormsModule
  ],
  styleUrls: ['./mesas.css', '../sub-pages.css']
})
export class Mesas implements OnInit, OnDestroy{

  private formBuilder = inject(FormBuilder);
  private mesaService = inject(MesaService);
  private webSocketService = inject(WebsocketService);

  mesas = signal<MesaResponse[]>([]);
  mesaSeleccionada = signal<MesaResponse | null>(null);
  private subscripcion = new Subscription();

  modalEliminarVisible = false;
  modalCrearEditarVisible = false;

  mesaForm = this.formBuilder.group({
    numero: ['', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
    capacidad: ['', [Validators.required, Validators.min(1), Validators.max(100)]]
  })

  ngOnInit(): void {
    this.cargarMesas();
    this.suscribirseACambios();
  }

  ngOnDestroy(): void {
    this.subscripcion.unsubscribe();
  }

  suscribirseACambios(): void {
    const actualizacionMesa = this.webSocketService.subscribe<MesaResponse>('/topic/mesas')
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
    const eliminacionMesa = this.webSocketService.subscribe<number>('/topic/mesas/eliminado')
      .subscribe(idMesaEliminada => {
        this.mesas.update(current => current.filter(m => m.id !== idMesaEliminada));
      });
    this.subscripcion.add(actualizacionMesa);
    this.subscripcion.add(eliminacionMesa);
  }

  cargarMesas(): void {
    this.mesaService.obtenerMesas().subscribe({
      next: (data) => this.mesas.set(data),
      error: (err) => console.log('Error al cargar mesas:', err)
    });
  }

  abrirModalCrearEditar(mesa?: MesaResponse): void {
    if (mesa) {
      this.mesaSeleccionada.set(mesa);
      this.mesaForm.patchValue({
        numero: mesa.numero,
        capacidad: mesa.capacidad.toString()
      });
    } else {
      this.mesaSeleccionada.set(null);
      this.mesaForm.reset();
    }
    this.modalCrearEditarVisible = true;
  }
  confirmarCrearEditar(): void {
    if (this.mesaForm.invalid) { return; }
    const mesaEditada = this.mesaSeleccionada();
    if (mesaEditada) {
      const datosActualizados: Partial<MesaRequest> = {
        numero: this.mesaForm.value.numero!,
        capacidad: parseInt(this.mesaForm.value.capacidad!)
      }
      this.mesaService.actualizarMesa(mesaEditada.id!, datosActualizados as MesaRequest).subscribe({
        next: () => this.cerrarModalCrearEditar(),
        error: (err) => console.log('Error al actualizar mesa:', err)
      })
    } else {
      const datosNuevos: Partial<MesaRequest> = {
        numero: this.mesaForm.value.numero!,
        capacidad: parseInt(this.mesaForm.value.capacidad!)
      }
      const nuevaMesa: MesaRequest = datosNuevos as MesaRequest;
      this.mesaService.crearMesa(nuevaMesa).subscribe({
        next: () => this.cerrarModalCrearEditar(),
        error: (err) => console.log('Error al crear mesa:', err)
      })
    }
  }
  cerrarModalCrearEditar(): void {
    this.limpiarFormulario();
    this.modalCrearEditarVisible = false;
  }

  abrirModalEliminar(mesa: MesaResponse): void {
    this.mesaSeleccionada.set(mesa);
    this.modalEliminarVisible = true;
  }
  confirmarEliminacion(): void {
    const idParaEliminar: number = this.mesaSeleccionada()?.id!;
    if (idParaEliminar !== 0) {
      this.mesaService.eliminarMesa(idParaEliminar).subscribe({
        next: () => this.cerrarModalEliminar(),
        error: (err) => console.log('Error al eliminar mesa:', err)
      });
    }
  }
  cerrarModalEliminar(): void {
    this.limpiarFormulario();
    this.modalEliminarVisible = false;
  }

  limpiarFormulario(): void {
    this.mesaSeleccionada.set(null);
    this.mesaForm.reset();
  }

}
