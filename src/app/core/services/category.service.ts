import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { env } from '../../../env/env';

export interface ICategory {
  _id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiURL = env.apiURL + 'category';

  constructor(private _http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getCategories() {
    return this._http.get<{ status: string; data: ICategory[] }>(this.apiURL);
  }

  addCategory(formData: FormData) {
    return this._http.post<{ status: string; message: string; data: ICategory }>(
      this.apiURL, 
      formData, 
      { headers: this.getHeaders() }
    );
  }
}
