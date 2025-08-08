import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Observable} from 'rxjs';
import {ItemMenuResponse} from '../../models/menu/ItemMenuResponse';
import {PaginatedResponse} from '../../models/paginado/PaginatedResponse';
import {ItemMenuRequest} from '../../models/menu/ItemMenuRequest';
import {EstadoItemMenuRequest} from '../../models/menu/EstadoItemMenuRequest';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private http = inject(HttpClient);
  private fullApiUrl = `${environment.apiUrl}/items-menu`;

  // OBTENER LISTADO DE LOS ITEMS ACTIVOS
  obtenerItemsMenu(page: number, size: number): Observable<PaginatedResponse<ItemMenuResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PaginatedResponse<ItemMenuResponse>>(this.fullApiUrl, {params});
  }

  // BUSQUEDA DINÁMICA DE LISTADO DE LOS ITEMS
  buscarItemsMenu(
    nombre: string | null,
    nombreCategoria: string | null,
    page: number,
    size: number
  ): Observable<PaginatedResponse<ItemMenuResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (nombre) { params = params.set('nombre', nombre); }
    if (nombreCategoria) { params = params.set('categoria', nombreCategoria); }
    return this.http.get<PaginatedResponse<ItemMenuResponse>>(`${this.fullApiUrl}/buscar`, {params});
  }

  // OBENTER UN ITEM POR SU ID
  obtenerItemMenuPorId(id: number): Observable<ItemMenuResponse> {
    return this.http.get<ItemMenuResponse>(`${this.fullApiUrl}/${id}`);
  }

  // CREAR UN NUEVO ITEM
  crearItemMenu(itemMenu: ItemMenuRequest): Observable<ItemMenuResponse> {
    return this.http.post<ItemMenuResponse>(`${this.fullApiUrl}`, itemMenu);
  }

  // ACTUALIZAR UN ITEM EXISTENTE
  actualizarItemMenu(id: number, itemMenu: ItemMenuRequest): Observable<ItemMenuResponse> {
    return this.http.put<ItemMenuResponse>(`${this.fullApiUrl}/${id}`, itemMenu);
  }

  // ACTUALIZAR EL ESTADO DE UN ITEM
  actualizarEstadoItemMenu(id: number, estado: EstadoItemMenuRequest): Observable<ItemMenuResponse> {
    return this.http.put<ItemMenuResponse>(`${this.fullApiUrl}/cambiar-estado/${id}`, estado);
  }

  // ELIMINAR UN ITEM POR SU ID
  eliminarItemMenu(id: number): Observable<void> {
    return this.http.delete<void>(`${this.fullApiUrl}/${id}`);
  }

}
