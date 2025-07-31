
export interface MenuItem {
  urlPath: string;
  icono: string;
  titulo: string;
}

export function listadoMenu(): MenuItem[] {
  return [
    {urlPath: 'ordenes', icono: 'notifications', titulo: 'Ordenes'},
    {urlPath: 'platillos', icono: 'dinner_dining', titulo: 'Platillos'},
    {urlPath: 'ajustes', icono: 'settings', titulo: 'Ajustes'}
  ];
}
