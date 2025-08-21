import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Observable} from 'rxjs';
import {OrdenResponseDTO} from '../../models/orden/OrdenResponseDTO';
import {PaginatedResponse} from '../../models/paginado/PaginatedResponse';
import {OrdenRequestDTO} from '../../models/orden/OrdenRequestDTO';
import {OrdenActualizarRequestDTO} from '../../models/orden/OrdenActualizarRequestDTO';
import {OrdenCambiarEstadoRequestDTO} from '../../models/orden/OrdenCambiarEstadoRequestDTO';

@Injectable({
  providedIn: 'root'
})
export class OrdenService {

  private http = inject(HttpClient);
  private fullApiUrl = `${environment.apiUrl}/ordenes`;

  // OBTENER LISTADO DE TODAS LAS ÓRDENES
  obtenerOrdenes(page: number, size: number): Observable<PaginatedResponse<OrdenResponseDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PaginatedResponse<OrdenResponseDTO>>(`${this.fullApiUrl}`, {params});
  }

  // OBTENER LISTADO DE LAS ÓRDENES DEL DÍA Y ACTIVAS
  obtenerOrdenesDelDia(page: number, size: number, estado?: string): Observable<PaginatedResponse<OrdenResponseDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (estado) { params = params.set('estado', estado); }
    return this.http.get<PaginatedResponse<OrdenResponseDTO>>(`${this.fullApiUrl}/hoy`, {params});
  }

  // OBTENER UNA ÓRDEN POR SU ID
  obtenerOrdenPorId(id: number): Observable<OrdenResponseDTO> {
    return this.http.get<OrdenResponseDTO>(`${this.fullApiUrl}/${id}`);
  }

  // CREAR UNA NUEVA ÓRDEN
  crearOrden(orden: OrdenRequestDTO): Observable<OrdenResponseDTO> {
    return this.http.post<OrdenResponseDTO>(`${this.fullApiUrl}`, orden);
  }

  // ACTUALIZAR UNA ÓRDEN PENDIENTE
  actualizarOrden(id: number, Orden: OrdenActualizarRequestDTO): Observable<OrdenResponseDTO> {
    return this.http.put<OrdenResponseDTO>(`${this.fullApiUrl}/${id}`, Orden);
  }

  // CAMBIAR ESTADO DE UNA ÓRDEN
  cambiarEstadoOrden(id: number, estado: OrdenCambiarEstadoRequestDTO): Observable<OrdenResponseDTO> {
    return this.http.patch<OrdenResponseDTO>(`${this.fullApiUrl}/cambiar-estado/${id}`, estado);
  }

  // DESACTIVAR ÓRDENES COMPLETADAS O CANCELADAS
  desactivarOrdenes(): Observable<void> {
    return this.http.delete<void>(`${this.fullApiUrl}`);
  }

}
