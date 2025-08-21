import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {InformacionAdicionalBoletaRequest} from '../../models/reporte/InformacionAdicionalBoletaRequest';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  private http = inject(HttpClient);
  private fullApiUrl = `${environment.apiUrl}/reports`;

  // GENERAR BOLETA DE CONSUMO
  generarBoletaConsumo(id: number, info: InformacionAdicionalBoletaRequest): Observable<Blob> {
    return this.http.post(`${this.fullApiUrl}/boleta/${id}`, info, {
      responseType: 'blob'
    });
  }

}
