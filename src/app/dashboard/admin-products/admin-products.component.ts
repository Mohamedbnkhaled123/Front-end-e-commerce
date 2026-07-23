import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { ModalService } from '../../core/services/modal.service';
import { IProduct } from '../../core/models/product.model';
import { env } from '../../../env/env';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
  pageSize = 3;
  private subscriptions = new Subscription();

  constructor(
    private _productService: ProductService,
    private _modalService: ModalService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  // Fetches all products
  loadProducts() {
    this.isLoading = true;
    this._cdr.detectChanges();

    const sub = this._productService.getAllProducts().subscribe({
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

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(term) || (p.slug && p.slug.toLowerCase().includes(term)));
    }

    if (this.selectedStatus === 'active') {
      result = result.filter(p => p.isActive !== false && p.isDeleted !== true && p.stock > 0);
    } else if (this.selectedStatus === 'outofstock') {
      result = result.filter(p => p.stock === 0);
    } else if (this.selectedStatus === 'archived') {
      result = result.filter(p => p.isActive === false || p.isDeleted !== true);
    }

    this.filteredProducts = result;
    this.currentPage = 1;
    this._cdr.detectChanges();
  }

  // Returns 3-items paginated slice
  get paginatedProducts(): IProduct[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
