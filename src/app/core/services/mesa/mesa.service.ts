import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Observable} from 'rxjs';
import {MesaResponse} from '../../models/mesa/MesaResponse';
import {MesaRequest} from '../../models/mesa/MesaRequest';

@Injectable({
  providedIn: 'root'
})
export class MesaService {

  private http = inject(HttpClient)
  private fullApiUrl = `${environment.apiUrl}/mesas`

  // OBTENER LISTADO DE MESAS
  obtenerMesas(): Observable<MesaResponse[]> {
    return this.http.get<MesaResponse[]>(this.fullApiUrl);
  }

  // OBTENER LISTADO DE MESAS DISPONIBLES
  obtenerMesasDisponibles(): Observable<MesaResponse[]> {
    return this.http.get<MesaResponse[]>(`${this.fullApiUrl}/disponibles`);
  }

  // OBTENER LISTADO DE MESAS CON ORDENES PENDIENTES
  obtenerMesasConOrdenPendiente(): Observable<MesaResponse[]> {
    return this.http.get<MesaResponse[]>(`${this.fullApiUrl}/con-orden-pendiente`);
  }

  // OBTENER UNA MESA POR ID
  obtenerMesaPorId(id: number): Observable<MesaResponse> {
    return this.http.get<MesaResponse>(`${this.fullApiUrl}/${id}`);
  }

  // CREAR UNA NUEVA MESA
  crearMesa(mesa: MesaRequest): Observable<MesaResponse> {
    return this.http.post<MesaResponse>(this.fullApiUrl, mesa);
  }

  // ACTUALIZAR UNA MESA EXISTENTE
  actualizarMesa(id: number, mesa: MesaRequest): Observable<MesaResponse> {
    return this.http.put<MesaResponse>(`${this.fullApiUrl}/${id}`, mesa);
  }

  // ELIMINAR UNA MESA POR SU ID
  eliminarMesa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.fullApiUrl}/${id}`);
  }

}
