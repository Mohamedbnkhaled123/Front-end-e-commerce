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
  private isServerless: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.serverUrl = env.apiURL.replace('/api/v1/', '');
    // Vercel serverless platform does not host persistent WebSocket / Socket.io servers
    this.isServerless = this.serverUrl.includes('vercel.app');
  }

  private async getSocket(): Promise<any> {
    if (!this.socket) {
      if (isPlatformBrowser(this.platformId) && !this.isServerless) {
        try {
          const { io } = await import('socket.io-client');
          this.socket = io(this.serverUrl, {
            reconnectionDelayMax: 10000,
            reconnectionAttempts: 2,
            timeout: 4000,
            autoConnect: true
          });
          this.socket.on('connect_error', () => {
            this.socket?.disconnect();
          });
        } catch {
          this.socket = { on: () => {}, off: () => {}, disconnect: () => {} };
        }
      } else {
        this.socket = { on: () => {}, off: () => {}, disconnect: () => {} };
      }
    }
    return this.socket;
  }

  onEvent<T>(event: string): Observable<T> {
    return new Observable<T>(observer => {
      let listener = (data: T) => {
        observer.next(data);
      };
      
      if (!this.isServerless) {
        setTimeout(() => {
          this.getSocket().then(socket => {
            if (socket && typeof socket.on === 'function') {
              socket.on(event, listener);
            }
          });
        }, 2500);
      }

      return () => {
        if (this.socket && typeof this.socket.off === 'function') {
          this.socket.off(event, listener);
        }
      };
    });
  }
}
