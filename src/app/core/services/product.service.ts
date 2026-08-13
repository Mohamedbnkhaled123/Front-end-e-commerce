import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from '../../../env/env';
import { IProductListRes, IProductRes } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiURL = env.apiURL + 'product';

  constructor(private _http: HttpClient) {}

  // Fetches all store products (now with server-side pagination support)
  getAllProducts(params?: any) {
    let queryParams = new HttpParams();
    if (params) {
      if (params.page) queryParams = queryParams.set('page', params.page);
      if (params.limit) queryParams = queryParams.set('limit', params.limit);
      if (params.search) queryParams = queryParams.set('search', params.search);
      if (params.category) queryParams = queryParams.set('category', params.category);
      if (params.subCategory) queryParams = queryParams.set('subCategory', params.subCategory);
      if (params.minPrice !== undefined && params.minPrice !== null && params.minPrice !== '') {
        queryParams = queryParams.set('minPrice', params.minPrice);
      }
      if (params.maxPrice !== undefined && params.maxPrice !== null && params.maxPrice !== '') {
        queryParams = queryParams.set('maxPrice', params.maxPrice);
      }
      if (params.all) queryParams = queryParams.set('all', params.all);
    }
    return this._http.get<IProductListRes>(this.apiURL, { params: queryParams });
  }

  // Fetches single product details by slug
  getProductBySlug(slug: string) {
    return this._http.get<IProductRes>(`${this.apiURL}/${slug}`);
  }

  // Fetches single product details by ID
  getProductById(id: string) {
    return this._http.get<IProductRes>(`${this.apiURL}/id/${id}`);
  }

  // Fetches related category products
  getRelatedProducts(slug: string) {
    return this._http.get<IProductListRes>(`${this.apiURL}/related/${slug}`);
  }

  // Creates new store product
  addProduct(payload: any) {
    return this._http.post<IProductRes>(this.apiURL, payload);
  }

  // Updates existing product details
  updateProduct(id: string, payload: any) {
    return this._http.patch<IProductRes>(`${this.apiURL}/${id}`, payload);
  }

  // Soft deletes product by ID
  deleteProduct(id: string) {
    return this._http.delete<{ status: string; message: string }>(`${this.apiURL}/${id}`);
  }

  // Restore product
  restoreProduct(id: string) {
    return this._http.patch(`${this.apiURL}/${id}/restore`, {});
  }
}
