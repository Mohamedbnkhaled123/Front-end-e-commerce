import { LocalizeFieldPipe } from '../../core/pipes/localize-field.pipe';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { ModalService } from '../../core/services/modal.service';
import { LanguageService } from '../../core/services/language.service';
import { IProduct } from '../../core/models/product.model';
import { env } from '../../../env/env';
import { Subscription } from 'rxjs';

import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe, LocalizeFieldPipe],
  templateUrl: './admin-products.component.html'
})
export class AdminProducts implements OnInit, OnDestroy {
  products: IProduct[] = [];
  filteredProducts: IProduct[] = [];
  staticURL = env.staticURL;

  searchTerm = '';
  selectedStatus = '';
  isLoading = false;
  message = '';
  currentPage = 1;
  pageSize = 13;
  private subscriptions = new Subscription();

  constructor(
    private _productService: ProductService,
    private _modalService: ModalService,
    public _langService: LanguageService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  // Fetches all products
  loadProducts() {
    this.isLoading = true;
    this._cdr.detectChanges();

    const sub = this._productService.getAllProducts({ all: 'true', limit: 5000 }).subscribe({
      next: (res) => {
        this.products = res.data || [];
        this.applyFilter();
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  // Filters products list
  applyFilter() {
    let result = [...this.products];

    if (this.selectedStatus === '') {
      result = result.filter(p => p.isDeleted !== true);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      // Normalize Arabic text function
      const normalize = (text: string) => text ? text.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي') : '';
      const normalizedTerm = normalize(term);

      result = result.filter(p => {
        const nName = normalize(p.name);
        const nNameAr = normalize(p.name_ar || '');
        const nDesc = normalize(p.desc || '');
        const nDescAr = normalize(p.desc_ar || '');
        const nSlug = normalize(p.slug || '');
        
        return nName.includes(normalizedTerm) || 
               nNameAr.includes(normalizedTerm) ||
               nDesc.includes(normalizedTerm) ||
               nDescAr.includes(normalizedTerm) ||
               nSlug.includes(normalizedTerm);
      });
    }

    if (this.selectedStatus === 'active') {
      result = result.filter(p => p.isActive !== false && p.isDeleted !== true && p.stock > 0);
    } else if (this.selectedStatus === 'lowstock') {
      result = result.filter(p => p.stock <= 3 && p.stock > 0);
    } else if (this.selectedStatus === 'outofstock') {
      result = result.filter(p => p.stock === 0);
    } else if (this.selectedStatus === 'archived') {
      result = result.filter(p => p.isActive === false && p.isDeleted !== true);
    } else if (this.selectedStatus === 'deleted') {
      result = result.filter(p => p.isDeleted === true);
    }

    this.filteredProducts = result;
    this.currentPage = 1;
    this._cdr.detectChanges();
  }

  // Exports products catalog as CSV
  exportCSV(): void {
    if (this.products.length === 0) return;
    const headers = ['Product ID', 'Name', 'Category', 'Price (EGP)', 'Discount (%)', 'Stock Qty', 'Status', 'Slug'];
    const rows = this.products.map(p => {
      const name = `"${p.name}"`;
      const cat = `"${(p.category as any)?.name || 'Category'}"`;
      const price = p.price.toFixed(2);
      const discount = (p.discount || 0).toString();
      const stock = p.stock.toString();
      const status = p.stock === 0 ? 'Out of Stock' : (p.isActive !== false ? 'Active' : 'Disabled');
      const slug = `"${p.slug || ''}"`;
      return [p._id, name, cat, price, discount, stock, status, slug].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `shoPRO_Products_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Returns 3-items paginated slice
  get paginatedProducts(): IProduct[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
  }

  get pageNumbers(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2; // Number of pages to show before and after current page
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (current > delta + 2) {
        pages.push('...');
      }
      
      const start = Math.max(2, current - delta);
      const end = Math.min(total - 1, current + delta);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (current < total - delta - 1) {
        pages.push('...');
      }
      pages.push(total);
    }
    return pages;
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this._cdr.detectChanges();
    }
  }

  prevPage() {
    this.setPage(this.currentPage - 1);
  }

  nextPage() {
    this.setPage(this.currentPage + 1);
  }

  // Soft deletes product by ID
  async deleteProduct(id: string) {
    const confirmed = await this._modalService.confirm({
      title: 'Delete Product',
      message: 'Are you sure you want to soft-delete this product from the store catalog?',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!confirmed) return;

    const sub = this._productService.deleteProduct(id).subscribe({
      next: () => {
        this.message = 'Product deleted successfully!';
        this.loadProducts();
        this._cdr.detectChanges();
        setTimeout(() => {
          this.message = '';
          this._cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this._modalService.alert({
          title: 'Product Deletion Failed',
          message: err?.error?.message || 'Error occurred while deleting product.',
          type: 'danger'
        });
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  // Restores a soft-deleted product
  async restoreProduct(id: string) {
    const isArabic = this._langService?.currentLang() === 'ar';
    const confirmed = await this._modalService.confirm({
      title: isArabic ? 'استرجاع المنتج' : 'Restore Product',
      message: isArabic ? 'هل أنت متأكد من رغبتك في استرجاع هذا المنتج وإعادته للكتالوج؟' : 'Are you sure you want to restore this product?',
      confirmText: isArabic ? 'نعم، استرجاع' : 'Yes, Restore',
      cancelText: isArabic ? 'إلغاء' : 'Cancel',
      type: 'success'
    });

    if (!confirmed) return;

    const sub = this._productService.restoreProduct(id).subscribe({
      next: () => {
        this.message = isArabic ? 'تم استرجاع المنتج بنجاح!' : 'Product restored successfully!';
        this.loadProducts();
        this._cdr.detectChanges();
        setTimeout(() => {
          this.message = '';
          this._cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this._modalService.alert({
          title: isArabic ? 'فشل استرجاع المنتج' : 'Product Restore Failed',
          message: err?.error?.message || (isArabic ? 'حدث خطأ أثناء استرجاع المنتج.' : 'Error occurred while restoring product.'),
          type: 'danger'
        });
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  // Permanently deletes product from database (Hard Delete)
  async permanentDeleteProduct(id: string) {
    const isArabic = this._langService?.currentLang() === 'ar';
    const confirmed = await this._modalService.confirm({
      title: isArabic ? 'حذف المنتج نهائياً' : 'Permanent Delete Product',
      message: isArabic
        ? 'تحذير: سيتم حذف هذا المنتج نهائياً من قاعدة البيانات ولن تتمكن من استرجاعه إطلاقاً. هل أنت متأكد من المتابعة؟'
        : 'Warning: This will permanently delete the product from the database. You will NOT be able to restore it. Are you sure you want to proceed?',
      confirmText: isArabic ? 'نعم، احذف نهائياً' : 'Yes, Delete Permanently',
      cancelText: isArabic ? 'إلغاء' : 'Cancel',
      type: 'danger'
    });

    if (!confirmed) return;

    const sub = this._productService.permanentDeleteProduct(id).subscribe({
      next: () => {
        this.message = isArabic ? 'تم حذف المنتج نهائياً بنجاح!' : 'Product permanently deleted successfully!';
        this.loadProducts();
        this._cdr.detectChanges();
        setTimeout(() => {
          this.message = '';
          this._cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this._modalService.alert({
          title: isArabic ? 'فشل الحذف النهائي' : 'Permanent Deletion Failed',
          message: err?.error?.message || (isArabic ? 'حدث خطأ أثناء الحذف النهائي للمنتج.' : 'Error occurred while permanently deleting product.'),
          type: 'danger'
        });
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
