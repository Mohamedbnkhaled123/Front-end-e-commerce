import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { env } from '../../../env/env';
import { ICategory } from '../models/category.model';

export type { ICategory };


@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiURL = env.apiURL + 'category';

  constructor(private _http: HttpClient) {}

  getCategories() {
    return this._http.get<{ status: string; data: ICategory[] }>(this.apiURL);
  }

  addCategory(payload: any) {
    return this._http.post<{ status: string; message: string; data: ICategory }>(
      this.apiURL, 
      payload
    );
  }
}


