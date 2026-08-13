import { LocalizeFieldPipe } from '../../core/pipes/localize-field.pipe';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { IProduct } from '../../core/models/product.model';
import { env } from '../../../env/env';
import { Subscription } from 'rxjs';

import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { FlyToCartService } from '../../core/services/fly-to-cart.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LocalizeFieldPipe, TranslatePipe],
  templateUrl: './products.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Products implements OnInit, OnDestroy {
  productsList: IProduct[] = [];
  paginatedProducts: IProduct[] = [];
  staticURL = env.staticURL;
  isLoading = true;

  // Filter input form state
  searchQuery: string = '';

  // Applied filter state
  appliedSearchQuery: string = '';
  appliedCategoryId: string = '';
  appliedSubCategoryId: string = '';
  appliedMinPrice: number | null = null;
  appliedMaxPrice: number | null = null;

  // Pagination state
  currentPage = 1;
  pageSize = 13;
  totalPages = 1;
  totalResults = 0;
  pageNumbers: (number | string)[] = [1];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private _productService: ProductService, 
    private _cartService: CartService,
    private _flyToCartService: FlyToCartService,
    private _cdr: ChangeDetectorRef,
    private _router: Router,
    private _route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const routeSub = this._route.queryParams.subscribe(params => {
      this.currentPage = Number(params['page']) || 1;
      this.appliedSearchQuery = params['search'] || '';
      this.appliedCategoryId = params['category'] || '';
      this.appliedSubCategoryId = params['subCategory'] || '';
      this.appliedMinPrice = params['minPrice'] ? Number(params['minPrice']) : null;
      this.appliedMaxPrice = params['maxPrice'] ? Number(params['maxPrice']) : null;

      // Sync draft state with applied state
      this.searchQuery = this.appliedSearchQuery;
      
      this.fetchProducts();
    });

    this.subscriptions.add(routeSub);
  }

  fetchProducts(): void {
    this.isLoading = true;
    this._cdr.detectChanges();

    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      search: this.appliedSearchQuery,
      category: this.appliedCategoryId,
      subCategory: this.appliedSubCategoryId,
      minPrice: this.appliedMinPrice,
      maxPrice: this.appliedMaxPrice
    };

    this._productService.getAllProducts(params).subscribe({
      next: (res) => {
        this.productsList = res.data || [];
        this.paginatedProducts = this.productsList;
        this.totalPages = res.totalPages || 1;
        this.totalResults = res.totalResults || 0;
        this.updatePagination();
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.productsList = [];
        this.paginatedProducts = [];
        this.totalPages = 1;
        this.totalResults = 0;
        this.updatePagination();
        this.isLoading = false;
        this._cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    this.appliedSearchQuery = this.searchQuery;

    // Reset to page 1 on new filter and update URL
    const queryParams = { 
      page: 1,
      search: this.appliedSearchQuery || null,
      category: this.appliedCategoryId || null,
      subCategory: this.appliedSubCategoryId || null,
      minPrice: this.appliedMinPrice !== null ? this.appliedMinPrice : null,
      maxPrice: this.appliedMaxPrice !== null ? this.appliedMaxPrice : null
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        this._router.navigate([], { relativeTo: this._route, queryParams });
      });
    } else {
      this._router.navigate([], { relativeTo: this._route, queryParams });
    }
  }


  updatePagination(): void {
    this.pageNumbers = [];
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2; // Number of pages to show before and after current page

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        this.pageNumbers.push(i);
      }
    } else {
      this.pageNumbers.push(1);
      if (current > delta + 2) {
        this.pageNumbers.push('...');
      }
      
      const start = Math.max(2, current - delta);
      const end = Math.min(total - 1, current + delta);
      
      for (let i = start; i <= end; i++) {
        this.pageNumbers.push(i);
      }
      
      if (current < total - delta - 1) {
        this.pageNumbers.push('...');
      }
      this.pageNumbers.push(total);
    }
  }

  get hasActiveFilters(): boolean {
    return !!(
      (this.appliedSearchQuery && this.appliedSearchQuery.trim()) ||
      this.appliedCategoryId ||
      this.appliedSubCategoryId ||
      (this.appliedMinPrice !== null && this.appliedMinPrice !== undefined && String(this.appliedMinPrice) !== '') ||
      (this.appliedMaxPrice !== null && this.appliedMaxPrice !== undefined && String(this.appliedMaxPrice) !== '')
    );
  }

  resetSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this._router.navigate([], {
        relativeTo: this._route,
        queryParams: { page },
        queryParamsHandling: 'merge'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage(): void {
    this.setPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.setPage(this.currentPage + 1);
  }

  addToCart(product: IProduct, event?: Event): void {
    if (!product || product.stock === 0) return;
    if (event) {
      const cardEl = (event.target as HTMLElement).closest('.group') || (event.target as HTMLElement);
      const imgElement = cardEl.querySelector('img') as HTMLImageElement;
      const cartIconElement = document.querySelector('[data-cart-icon]') as HTMLElement || document.getElementById('cartIcon');
      
      if (imgElement && cartIconElement) {
        this._flyToCartService.fly(imgElement, cartIconElement).then(() => {
          cartIconElement.classList.add('animate-cart-pulse');
          setTimeout(() => cartIconElement.classList.remove('animate-cart-pulse'), 300);
        });
      } else {
        this._flyToCartService.fly(cardEl, event);
      }
    }
    this._cartService.addToCart(product, 1).subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}