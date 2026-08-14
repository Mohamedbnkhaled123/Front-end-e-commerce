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

  addSubCategory(payload: { name: string, slug?: string, categoryId?: string, category?: string }): Observable<any> {
    const body: any = {
      name: payload.name,
      slug: payload.slug || payload.name.trim().toLowerCase().replace(/[\s_]+/g, '-')
    };
    if (payload.categoryId) {
      body.categoryId = payload.categoryId;
      body.category = payload.categoryId;
    }
    if (payload.category) {
      body.category = payload.category;
      body.categoryId = payload.category;
    }
    return this.http.post(this.baseUrl, body);
  }

  deleteSubCategory(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
