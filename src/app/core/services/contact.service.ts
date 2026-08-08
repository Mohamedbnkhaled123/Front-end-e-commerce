import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from '../../../env/env';

export interface IContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = env.apiURL + 'contact';

  constructor(private http: HttpClient) {}

  // Public: Send a new contact message
  sendMessage(data: { name: string, email: string, subject: string, message: string }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // Admin: Get paginated messages
  getMessages(page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get(this.apiUrl, { params });
  }

  // Admin: Mark message as read
  markAsRead(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/read`, {});
  }

  // Admin: Delete message
  deleteMessage(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
