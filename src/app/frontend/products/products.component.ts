import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { CategoryService, ICategory } from '../../core/services/category.service';
import { IProduct } from '../../core/models/product.model';
import { env } from '../../../env/env';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './products.component.html'
})
export class Products implements OnInit, OnDestroy {
  productsList: IProduct[] = [];
  categoriesList: ICategory[] = [];
  staticURL = env.staticURL;

  // Filter state
  searchQuery: string = '';
  selectedCategoryId: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  // Pagination state
  currentPage = 1;
  pageSize = 3;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private _productService: ProductService, 
    private _cartService: CartService,
    private _categoryService: CategoryService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const productsSub = this._productService.getAllProducts().subscribe({
      next: (res) => {
        const all: IProduct[] = res.data || [];
        this.productsList = all.filter(p => p.isActive !== false && p.isDeleted !== true);
        this.currentPage = 1;
        this._cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this._cdr.detectChanges();
      }
    });

    const categoriesSub = this._categoryService.getCategories().subscribe({
      next: (res) => {
        this.categoriesList = res.data || [];
        this._cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
      }
    });

    this.subscriptions.add(productsSub);
    this.subscriptions.add(categoriesSub);
  }

  // Returns list of products matching current search and filter criteria
  get filteredProducts(): IProduct[] {
    const query = (this.searchQuery || '').trim().toLowerCase();

    return this.productsList.filter(p => {
      const matchesSearch = !query || 
        (p.name && p.name.toLowerCase().includes(query)) || 
        (p.desc && p.desc.toLowerCase().includes(query));

      const catId = typeof p.category === 'object' && p.category ? p.category._id : p.category;
      const matchesCategory = !this.selectedCategoryId || catId === this.selectedCategoryId;

      const matchesMinPrice = this.minPrice === null || this.minPrice === undefined || String(this.minPrice) === '' || p.price >= Number(this.minPrice);
      const matchesMaxPrice = this.maxPrice === null || this.maxPrice === undefined || String(this.maxPrice) === '' || p.price <= Number(this.maxPrice);

      return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
    });
  }

  // Returns paginated products slice from filtered results (3 items per page)
  get paginatedProducts(): IProduct[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(startIndex, startIndex + this.pageSize);
  }

  // Calculates total pages count based on filtered products
  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
  }

  // Generates page numbers array
  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Checks if any filters are currently active
  get hasActiveFilters(): boolean {
    return !!(
      (this.searchQuery && this.searchQuery.trim()) ||
      this.selectedCategoryId ||
      (this.minPrice !== null && this.minPrice !== undefined && String(this.minPrice) !== '') ||
      (this.maxPrice !== null && this.maxPrice !== undefined && String(this.maxPrice) !== '')
    );
  }

  // Handles input changes to reset pagination to page 1
  onFilterChange() {
    this.currentPage = 1;
    this._cdr.detectChanges();
  }

  // Resets all filters to initial state
  resetFilters() {
    this.searchQuery = '';
    this.selectedCategoryId = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.currentPage = 1;
    this._cdr.detectChanges();
  }

  // Navigates to target page
  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this._cdr.detectChanges();
    }
  }

  prevPage() {
    this.setPage(this.currentPage - 1);
  }

  nextPage() {
    this.setPage(this.currentPage + 1);
  }

  // Adds product to cart
  addToCart(product: IProduct) {
    if (!product) return;
    this._cartService.addToCart(product, 1).subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}