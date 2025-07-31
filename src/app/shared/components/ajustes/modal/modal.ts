import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'ajustes-modal',
  standalone: true,
  templateUrl: './modal.html',
  styleUrl: './modal.css'
})
export class Modal {

  @Input() estadoAbierto = false;
  @Output() cerrarModal = new EventEmitter<void>();

  onCerrarModal(): void {
    this.cerrarModal.emit();
  }

}
