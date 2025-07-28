
export interface MenuItem {
  urlPath: string;
  icono: string;
  titulo: string;
}

export function listadoMenu(): MenuItem[] {
  return [
    {urlPath: 'Ordenes', icono: 'notifications', titulo: 'Ordenes'},
    {urlPath: 'Platillos', icono: 'dinner_dining', titulo: 'Platillos'},
    {urlPath: 'Ajustes', icono: 'settings', titulo: 'Ajustes'}
  ];
}
