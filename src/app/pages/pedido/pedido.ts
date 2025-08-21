import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'pedido',
  standalone: true,
  templateUrl: './pedido.html',
  imports: [
    RouterOutlet
  ],
  styleUrls: ['./pedido.css']
})
export class Pedido {}
