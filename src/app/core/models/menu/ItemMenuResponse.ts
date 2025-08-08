import {CategoriaResponse} from '../categoria/CategoriaResponse';

export interface ItemMenuResponse {
  id: number,
  nombre: string,
  descripcion: string,
  precio: number,
  enlace_imagen: string,
  categoria: CategoriaResponse,
  estado: string
}
