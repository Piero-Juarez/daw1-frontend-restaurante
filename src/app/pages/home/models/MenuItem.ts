
export interface MenuItem {
  urlPath: string;
  icono: string;
  titulo: string;
}

export function listadoMenu(): MenuItem[] {
  return [
    {urlPath: 'ordenes', icono: 'notifications', titulo: 'Ordenes'},
    {urlPath: 'menu', icono: 'dinner_dining', titulo: 'Menú'},
    {urlPath: 'ajustes', icono: 'settings', titulo: 'Ajustes'}
  ];
}
