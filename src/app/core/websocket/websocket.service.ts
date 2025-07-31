import {inject, Injectable} from '@angular/core';
import {Client, IMessage} from '@stomp/stompjs';
import {BehaviorSubject, filter, Observable, switchMap} from 'rxjs';
import SockJS from 'sockjs-client';
import {AuthService} from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private authService = inject(AuthService);

  private client: Client;
  private connectionSubject = new BehaviorSubject<boolean>(false);
  public connection$ = this.connectionSubject.asObservable();

  constructor() {
    this.client = new Client({
      brokerURL: undefined,
      webSocketFactory: () => new SockJS('http://localhost:8080/websocket'),
      reconnectDelay: 5000,
      debug: (str) => { console.log(new Date(), str); },

      beforeConnect: () => {
        const token = this.authService.getAccessToken();
        if (token) {
          this.client.connectHeaders = {
            Authorization: `Bearer ${token}`
          };
        }
      }
    });

    this.client.onConnect = () => {
      this.connectionSubject.next(true);
    }

    this.client.onDisconnect = () => {
      this.connectionSubject.next(false);
    }

    this.client.onStompError = (frame) => {
      console.error('Error del broker: ' + frame.headers['message']);
      console.error('Detalles: ' + frame.body);
    };

    this.client.activate();
  }

  subscribe<T>(topic: string): Observable<T> {
    // Usamos el observable de conexión para resolver la condición de carrera
    return this.connection$.pipe(
      // 1. Espera (filtra) hasta que connection$ emita 'true'
      filter(isConnected => isConnected),
      // 2. Una vez conectado, cambia (switchMap) a un nuevo observable que realiza la suscripción
      switchMap(() => {
        return new Observable<T>(observer => {
          console.log(`Conexión establecida. Suscribiendo al tópico: ${topic}`);
          const subscription = this.client.subscribe(topic, (message: IMessage) => {
            const body = JSON.parse(message.body) as T;
            observer.next(body);
          });

          // Cuando el componente se desuscribe, cancelamos la suscripción STOMP
          return () => {
            console.log(`Cancelando suscripción al tópico: ${topic}`);
            subscription.unsubscribe();
          };
        });
      })
    );
  }

}
