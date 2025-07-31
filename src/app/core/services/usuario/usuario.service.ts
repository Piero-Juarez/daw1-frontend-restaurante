import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {UsuarioResponse} from '../../models/usuario/UsuarioResponse';
import {UsuarioRequest} from '../../models/usuario/UsuarioRequest';
import {environment} from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private http = inject(HttpClient)
  private fullApiUrl = `${environment.apiUrl}/usuarios`

  // OBTIENE LISTADO DE USUARIOS ACTIVOS
  obtenerUsuariosActivos(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.fullApiUrl);
  }

  // OBTIENE UN USUARIO POR ID
  obtenerUsuarioPorId(id: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.fullApiUrl}/${id}`);
  }

  // CREA UN NUEVO USUARIO
  crearUsuario(usuario: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(this.fullApiUrl, usuario);
  }

  // ACTUALIZA UN USUARIO EXISTENTE
  actualizarUsuario(id: number, usuario: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.fullApiUrl}/${id}`, usuario);
  }

  // ELIMINA UN USUARIO POR SU ID
  eliminarUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.fullApiUrl}/${id}`);
  }

}
