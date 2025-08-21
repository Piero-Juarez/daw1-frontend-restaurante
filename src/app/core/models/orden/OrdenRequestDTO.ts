import {DetalleOrdenRequestDTO} from '../detalleorden/DetalleOrdenRequestDTO';

export interface OrdenRequestDTO {
  mesa_id: number;
  detalles: DetalleOrdenRequestDTO[];
}
