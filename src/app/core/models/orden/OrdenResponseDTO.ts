import {DetalleOrdenResponseDTO} from '../detalleorden/DetalleOrdenResponseDTO';

export interface OrdenResponseDTO {
  id: number;
  codigo_orden: string;
  mesa_id: number;
  numero_mesa: string;
  estado_orden: string;
  fecha_creacion: string;
  hora_creacion: string;
  monto_sub_total: number;
  monto_total: number;
  detalles: DetalleOrdenResponseDTO[]
}
