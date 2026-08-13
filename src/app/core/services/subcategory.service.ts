import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from '../../../env/env';

export interface ISubCategory {
  _id: string;
  name: string;
  slug?: string;
  category?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {
  private baseUrl = `${env.apiURL}subcategory`;

  constructor(private http: HttpClient) {}

  getSubCategoriesByMain(categoryId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${categoryId}`);
  }

  addSubCategory(payload: { name: string, slug?: string, categoryId: string }): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }

  deleteSubCategory(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
