import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from '../../../env/env';
import { IProductListRes, IProductRes } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiURL = env.apiURL + 'product';

  constructor(private _http: HttpClient) {}

  // Fetches all store products
  getAllProducts() {
    return this._http.get<IProductListRes>(this.apiURL);
  }

  // Fetches single product details
  getProductBySlug(slug: string) {
    return this._http.get<IProductRes>(`${this.apiURL}/${slug}`);
  }

  // Fetches related category products
  getRelatedProducts(slug: string) {
    return this._http.get<IProductListRes>(`${this.apiURL}/related/${slug}`);
  }

  // Creates new store product
  addProduct(formData: FormData) {
    return this._http.post<IProductRes>(this.apiURL, formData);
  }

  // Updates existing product details
  updateProduct(id: string, payload: any) {
    return this._http.patch<IProductRes>(`${this.apiURL}/${id}`, payload);
  }

  // Soft deletes product by ID
  deleteProduct(id: string) {
    return this._http.delete<{ status: string; message: string }>(`${this.apiURL}/${id}`);
  }
}
