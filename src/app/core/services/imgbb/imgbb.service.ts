import {Injectable} from '@angular/core';
import {HttpClient, HttpContext} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Observable} from 'rxjs';
import {ImgbbResponse} from '../../models/imgbb/ImgbbResponse';
import {BYPASS_TOKEN_INTERCEPTOR} from '../../contexts/http-context';

@Injectable({
  providedIn: 'root'
})
export class ImgbbService {

  constructor(private http: HttpClient) { }

  private readonly apiUrl = 'https://api.imgbb.com/1/upload';
  private readonly apiKey = environment.imgbbApiKey;

  subirImagen(image: File): Observable<ImgbbResponse> {
    const  formData = new FormData();
    formData.append('image', image);

    return this.http.post<ImgbbResponse>(`${this.apiUrl}?key=${this.apiKey}`, formData, { context: new HttpContext().set(BYPASS_TOKEN_INTERCEPTOR, true) });
  }

}
