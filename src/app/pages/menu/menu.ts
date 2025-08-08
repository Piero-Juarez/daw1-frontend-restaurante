import {Component, OnInit} from '@angular/core';
import {ItemMenuResponse} from '../../core/models/menu/ItemMenuResponse';
import {MenuService} from '../../core/services/menu/menu.service';
import {FormsModule} from '@angular/forms';
import {CategoriaResponse} from '../../core/models/categoria/CategoriaResponse';
import {CategoriaService} from '../../core/services/categoria/categoria.service';

@Component({
  selector: 'menu',
  standalone: true,
  templateUrl: './menu.html',
  imports: [
    FormsModule
  ],
  styleUrls: ['./menu.css']
})
export class Menu implements OnInit {

  categorias: CategoriaResponse[] = [];

  items: ItemMenuResponse[] = [];
  currentPage: number = 0;
  totalPages: number = 0;
  totalElements: number = 0;
  pageSize: number = 10;

  pageNumbers: (number | '...')[] = [];

  buscarPorNombre: string = '';
  buscarPorCategoria: string = '';

  constructor(
    private readonly menuService: MenuService,
    private readonly categoryService: CategoriaService
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos(page: number = 0): void {
    const terminosDeBusqueda = this.buscarPorNombre || this.buscarPorCategoria;
    const datoObservable = terminosDeBusqueda
      ? this.menuService.buscarItemsMenu(this.buscarPorNombre, this.buscarPorCategoria, page, this.pageSize)
      : this.menuService.obtenerItemsMenu(page, this.pageSize);
    datoObservable.subscribe(response => {
      this.items = response.content;
      console.log(response);
      this.currentPage = response.page.number;
      this.totalPages = response.page.totalPages;
      this.totalElements = response.page.totalElements;

      // ACTUALIZAR LA PAGINACIÓN
      this.actualizarPaginado();
    });
    this.categoryService.obtenerCategorias().subscribe(suscribe => {
      this.categorias = suscribe;
    });
  }

  onBuscar(): void {
    this.cargarDatos(0);
  }

  seleccionarCategoria(nombreCategoria: string): void {
    this.buscarPorCategoria = nombreCategoria;
    this.cargarDatos(0);
  }

  limpiarFiltroCategoria(): void {
    this.buscarPorCategoria = '';
    this.cargarDatos(0);
  }

  limpiarBusqueda(): void {
    this.buscarPorNombre = '';
    this.cargarDatos(0);
  }

  private actualizarPaginado(): void {
    if (this.totalPages <= 7) {
      this.pageNumbers = Array.from({length: this.totalPages}, (_, i) => i + 1);
    } else {
      const firstPage = 1;
      const lastPage = this.totalPages;
      const currentPageNum = this.currentPage + 1;

      if (currentPageNum <= 4) {
        this.pageNumbers = [1, 2, 3, 4, 5, '...', lastPage];
      } else if (currentPageNum >= this.totalPages - 3) {
        this.pageNumbers = [firstPage, '...', lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage]
      } else {
        this.pageNumbers = [firstPage, '...', currentPageNum - 1, currentPageNum, currentPageNum + 1, '...', lastPage];
      }
    }
  }

  cambiarEstado(id: number) {

  }
}
