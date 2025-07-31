import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {CategoriaResponse} from '../../models/categoria/CategoriaResponse';
import {Observable} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {CategoriaRequest} from '../../models/categoria/CategoriaRequest';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {

  private http = inject(HttpClient)
  private fullApiUrl = `${environment.apiUrl}/categorias`

  // OBTENER LISTADO DE CATEGORÍAS
  obtenerCategorias(): Observable<CategoriaResponse[]> {
    return this.http.get<CategoriaResponse[]>(this.fullApiUrl);
  }

  // OBTENER UNA CATEGORÍA POR ID
  obtenerCategoriaPorId(id: number): Observable<CategoriaResponse> {
    return this.http.get<CategoriaResponse>(`${this.fullApiUrl}/${id}`);
  }

  // CREAR UNA NUEVA CATEGORÍA
  crearCategoria(categoria: CategoriaRequest): Observable<CategoriaResponse> {
    return this.http.post<CategoriaResponse>(this.fullApiUrl, categoria);
  }

  // ACTUALIZAR UNA CATEGORÍA EXISTENTE
  actualizarCategoria(id: number, categoria: CategoriaRequest): Observable<CategoriaResponse> {
    return this.http.put<CategoriaResponse>(`${this.fullApiUrl}/${id}`, categoria);
  }

  // ELIMINAR UNA CATEGORÍA POR SU ID
  eliminarCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.fullApiUrl}/${id}`);
  }

}
