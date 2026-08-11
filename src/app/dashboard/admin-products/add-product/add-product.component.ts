import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService, ICategory } from '../../../core/services/category.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './add-product.component.html'
})
export class AddProduct implements OnInit {

  // === Product Form State ===
  productForm!: FormGroup;
  selectedFile: File | null = null;
  selectedCategoryId = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // === Categories State ===
  categories: ICategory[] = [];
  isLoadingCategories = true;

  // === Add Category Modal ===
  showCategoryModal = false;
  newCategoryName = '';
  newCategoryFile: File | null = null;
  isAddingCategory = false;
  categoryModalError = '';

  constructor(
    private _fb: FormBuilder,
    private _productService: ProductService,
    private _categoryService: CategoryService,
    private _router: Router,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.productForm = this._fb.group({
      name:        ['', Validators.required],
      slug:        [''],
      desc:        ['', Validators.required],
      price:       [null, [Validators.required, Validators.min(0)]],
      discount:    [0, [Validators.min(0), Validators.max(100)]],
      stock:       [null, [Validators.required, Validators.min(0)]],
      newArrived:  [false],
      mostPopular: [false],
    });

    // Auto-generate slug from name
    this.productForm.get('name')!.valueChanges.subscribe((val: string) => {
      if (val && !this.productForm.get('slug')!.dirty) {
        const generated = val.toLowerCase().trim()
          .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        this.productForm.get('slug')!.setValue(generated, { emitEvent: false });
      }
    });

    this.loadCategories();
  }

  loadCategories() {
    this.isLoadingCategories = true;
    this._categoryService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data || [];
        if (this.categories.length > 0 && !this.selectedCategoryId) {
          this.selectedCategoryId = this.categories[0]._id;
        }
        this.isLoadingCategories = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.categories = [];
        this.isLoadingCategories = false;
        this._cdr.detectChanges();
      }
    });
  }

  selectCategory(id: string) {
    this.selectedCategoryId = id;
    this._cdr.detectChanges();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const fileNameLower = (file.name || '').toLowerCase();
      this.selectedFile = file;
    }
  }

  // === Category Modal ===
  openCategoryModal() {
    this.showCategoryModal = true;
    this.newCategoryName = '';
    this.newCategoryFile = null;
    this.categoryModalError = '';
    this._cdr.detectChanges();
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
    this._cdr.detectChanges();
  }

  onCategoryFileSelected(event: any) {
    this.newCategoryFile = event.target.files[0] || null;
  }

  submitNewCategory() {
    this.categoryModalError = '';
    if (!this.newCategoryName.trim()) {
      this.categoryModalError = 'Please enter a category name.';
      return;
    }
    this.isAddingCategory = true;
    this._cdr.detectChanges();

    const fd = new FormData();
    fd.append('name', this.newCategoryName.trim());
    if (this.newCategoryFile) fd.append('img', this.newCategoryFile);

    this._categoryService.addCategory(fd).subscribe({
      next: (res) => {
        this.isAddingCategory = false;
        this.showCategoryModal = false;
        const cat = res.data;
        if (cat?._id) {
          this.categories = [...this.categories, cat];
          this.selectedCategoryId = cat._id;
        } else {
          this.loadCategories();
        }
        this._cdr.detectChanges();
      },
      error: (err: any) => {
        this.isAddingCategory = false;
        this.categoryModalError = err?.error?.message || 'Failed to add category.';
        this._cdr.detectChanges();
      }
    });
  }

  // === Submit Product ===
  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.productForm.invalid) {
      this.errorMessage = 'يرجى ملء جميع الحقول المطلوبة.';
      return;
    }
    if (!this.selectedCategoryId) {
      this.errorMessage = 'يرجى تحديد قسم للمنتج.';
      return;
    }
    if (!this.selectedFile) {
      this.errorMessage = 'يرجى اختيار صورة للمنتج.';
      return;
    }

    this.isLoading = true;
    this._cdr.detectChanges();

    const fd = new FormData();
    const vals = this.productForm.value;
    fd.append('name', vals.name);
    fd.append('slug', vals.slug || '');
    fd.append('desc', vals.desc);
    fd.append('price', vals.price);
    fd.append('discount', vals.discount || 0);
    fd.append('stock', vals.stock);
    fd.append('newArrived', vals.newArrived ? 'true' : 'false');
    fd.append('mostPopular', vals.mostPopular ? 'true' : 'false');
    fd.append('category', this.selectedCategoryId);
    fd.append('img', this.selectedFile);

    this._productService.addProduct(fd).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'تمت إضافة المنتج بنجاح!';
        this.productForm.reset({ discount: 0, newArrived: false, mostPopular: false });
        this.selectedFile = null;
        this._cdr.detectChanges();
        
        setTimeout(() => {
          this._router.navigate(['/admin/products']);
        }, 1500);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'حدث خطأ أثناء إضافة المنتج.';
        this._cdr.detectChanges();
      }
    });
  }
}
