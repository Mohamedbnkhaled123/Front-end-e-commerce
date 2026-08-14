import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { env } from '../../../env/env';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: any = null;
  private serverUrl: string;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.serverUrl = env.apiURL.replace('/api/v1/', '');
  }

  private async getSocket(): Promise<any> {
    if (!this.socket) {
      if (isPlatformBrowser(this.platformId)) {
        const { io } = await import('socket.io-client');
        this.socket = io(this.serverUrl, {
          reconnectionDelayMax: 10000,
          reconnectionAttempts: 2,
          timeout: 4000,
          autoConnect: true
        });
        this.socket.on('connect_error', () => {
          // If serverless backend returns 404 on socket.io, stop continuous polling to save bandwidth
          this.socket?.disconnect();
        });
      } else {
        this.socket = { on: () => {}, off: () => {} };
      }
    }
    return this.socket;
  }

  onEvent<T>(event: string): Observable<T> {
    return new Observable<T>(observer => {
      let listener = (data: T) => {
        observer.next(data);
      };
      
      // Delay connection slightly to allow initial critical render to finish
      setTimeout(() => {
        this.getSocket().then(socket => {
          socket.on(event, listener);
        });
      }, 2500);

      return () => {
        if (this.socket) {
          this.socket.off(event, listener);
        }
      };
    });
  }
}
