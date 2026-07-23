import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { ProductService } from '../services/product.service';
import { IProductRes } from '../models/product.model';
import { catchError, of } from 'rxjs';

// Resolves product details by slug
export const productResolver: ResolveFn<IProductRes | null> = (route: ActivatedRouteSnapshot) => {
  const productService = inject(ProductService);
  const slug = route.paramMap.get('slug');

  if (!slug) {
    return of(null);
  }

  return productService.getProductBySlug(slug).pipe(
    catchError(() => of(null))
  );
};
