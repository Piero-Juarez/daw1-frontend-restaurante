
export interface MenuItem {
  urlPath: string;
  icono: string;
  titulo: string;
  roles?: string[];
}

export function listadoMenu(): MenuItem[] {
  return [
    {
      urlPath: 'pedido',
      icono: 'order_play',
      titulo: 'Hacer Pedido',
      roles: ['Camarero']
    },
    {
      urlPath: 'ordenes',
      icono: 'notifications',
      titulo: 'Ordenes',
      roles: ['Administrador', 'Cajero']
    },
    {
      urlPath: 'ordenes-listas',
      icono: 'order_approve',
      titulo: 'Ordenes listas',
      roles: ['Camarero', 'Cajero']
    },
    {
      urlPath: 'menu',
      icono: 'dinner_dining',
      titulo: 'Menú',
      roles: ['Administrador']
    },
    {
      urlPath: 'ajustes',
      icono: 'settings',
      titulo: 'Ajustes',
      roles: ['Administrador']
    }
  ];
}
