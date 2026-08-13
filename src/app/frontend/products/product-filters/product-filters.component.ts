import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService, ICategory } from '../../../core/services/category.service';
import { SubCategoryService, ISubCategory } from '../../../core/services/subcategory.service';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe],
  templateUrl: './product-filters.component.html'
})
export class ProductFilters implements OnInit, OnDestroy {
  categoriesList: ICategory[] = [];
  subCategoriesList: ISubCategory[] = [];
  
  selectedCategoryId: string = '';
  selectedSubCategoryId: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  searchQuery: string = '';
  
  matchingCount: number = 0;
  isCounting: boolean = true;

  private subscriptions: Subscription = new Subscription();
  private countTimeout: any;

  constructor(
    private _productService: ProductService,
    private _categoryService: CategoryService,
    private _subCategoryService: SubCategoryService,
    private _cdr: ChangeDetectorRef,
    private _router: Router,
    private _route: ActivatedRoute,
    private _location: Location
  ) {}

  ngOnInit(): void {
    const routeSub = this._route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
      this.selectedCategoryId = params['category'] || '';
      this.selectedSubCategoryId = params['subCategory'] || '';
      this.minPrice = params['minPrice'] ? Number(params['minPrice']) : null;
      this.maxPrice = params['maxPrice'] ? Number(params['maxPrice']) : null;
      
      if (this.selectedCategoryId) {
        this.loadSubCategories(this.selectedCategoryId);
      }
      
      this.updateCount();
    });

    const categoriesSub = this._categoryService.getCategories().subscribe({
      next: (res) => {
        this.categoriesList = res.data || [];
        this._cdr.detectChanges();
      }
    });

    this.subscriptions.add(routeSub);
    this.subscriptions.add(categoriesSub);
  }

  loadSubCategories(categoryId: string): void {
    if (!categoryId) {
      this.subCategoriesList = [];
      this.selectedSubCategoryId = '';
      return;
    }
    this._subCategoryService.getSubCategoriesByMain(categoryId).subscribe({
      next: (res) => {
        this.subCategoriesList = res.data || [];
        this._cdr.detectChanges();
      }
    });
  }

  onCategoryChange(): void {
    this.selectedSubCategoryId = '';
    this.loadSubCategories(this.selectedCategoryId);
    this.onFilterChange();
  }

  onFilterChange(): void {
    // Debounce the count update
    clearTimeout(this.countTimeout);
    this.isCounting = true;
    this._cdr.detectChanges();
    
    this.countTimeout = setTimeout(() => {
      this.updateCount();
    }, 500);
  }

  updateCount(): void {
    const params = {
      page: 1,
      limit: 1,
      search: this.searchQuery,
      category: this.selectedCategoryId,
      subCategory: this.selectedSubCategoryId,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice
    };

    this._productService.getAllProducts(params).subscribe({
      next: (res) => {
        this.matchingCount = res.totalResults || 0;
        this.isCounting = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.matchingCount = 0;
        this.isCounting = false;
        this._cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    const queryParams = { 
      page: 1,
      search: this.searchQuery || null,
      category: this.selectedCategoryId || null,
      subCategory: this.selectedSubCategoryId || null,
      minPrice: this.minPrice !== null ? this.minPrice : null,
      maxPrice: this.maxPrice !== null ? this.maxPrice : null
    };

    this._router.navigate(['/products'], { queryParams });
  }

  resetFilters(): void {
    this.selectedCategoryId = '';
    this.selectedSubCategoryId = '';
    this.subCategoriesList = [];
    this.minPrice = null;
    this.maxPrice = null;
    this.onFilterChange();
  }
  
  goBack(): void {
    this._location.back();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    clearTimeout(this.countTimeout);
  }
}
