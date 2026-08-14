import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService, ICategory } from '../../../core/services/category.service';
import { SubCategoryService, ISubCategory } from '../../../core/services/subcategory.service';
import { ModalService } from '../../../core/services/modal.service';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import { env } from '../../../../env/env';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './edit-product.component.html'
})
export class EditProduct implements OnInit, OnDestroy {
  productId = '';
  editForm!: FormGroup;
  staticURL = env.staticURL;

  currentImgURL = '';
  selectedFile: File | null = null;

  categories: ICategory[] = [];
  subCategories: ISubCategory[] = [];
  selectedCategoryId = '';
  selectedSubCategoryId = '';
  isLoadingCategories = false;
  isLoadingSubCategories = false;

  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  // === Add Category Modal ===
  showCategoryModal = false;
  newCategoryName = '';
  newSubCategoryName = '';
  newCategoryFile: File | null = null;
  isAddingCategory = false;
  categoryModalError = '';

  // === Add SubCategory Modal ===
  showSubCategoryModal = false;
  newSubCatName = '';
  targetCategoryIdForSub = '';
  isAddingSubCategory = false;
  subCategoryModalError = '';

  private subscriptions = new Subscription();

  constructor(
    private _fb: FormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _productService: ProductService,
    private _categoryService: CategoryService,
    private _subCategoryService: SubCategoryService,
    private _modalService: ModalService,
    private _cloudinaryService: CloudinaryService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.productId = this._route.snapshot.paramMap.get('id') || '';

    this.editForm = this._fb.group({
      name:        ['', Validators.required],
      desc:        ['', Validators.required],
      price:       [null, [Validators.required, Validators.min(0)]],
      discount:    [0, [Validators.min(0), Validators.max(100)]],
      stock:       [null, [Validators.required, Validators.min(0)]],
      slug:        [''],
      isActive:    [true],
      newArrived:  [false],
      mostPopular: [false]
    });

    if (this.productId) {
      this.loadProductDetails();
      this.loadCategories();
    }
  }

  loadCategories() {
    this.isLoadingCategories = true;
    this._categoryService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data || [];
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

  loadSubCategories(categoryId: string) {
    if (!categoryId) {
      this.subCategories = [];
      this.selectedSubCategoryId = '';
      return;
    }
    this.isLoadingSubCategories = true;
    this._subCategoryService.getSubCategoriesByMain(categoryId).subscribe({
      next: (res) => {
        this.subCategories = res.data || [];
        this.isLoadingSubCategories = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.subCategories = [];
        this.isLoadingSubCategories = false;
        this._cdr.detectChanges();
      }
    });
  }

  selectCategory(id: string) {
    if (this.selectedCategoryId !== id) {
      this.selectedCategoryId = id;
      this.selectedSubCategoryId = '';
      this.loadSubCategories(id);
      this._cdr.detectChanges();
    }
  }

  selectSubCategory(id: string) {
    this.selectedSubCategoryId = id;
    this._cdr.detectChanges();
  }

  // Loads existing product details
  loadProductDetails() {
    this.isLoading = true;
    this._cdr.detectChanges();

    const sub = this._productService.getProductById(this.productId).subscribe({
      next: (res) => {
        const found = res.data;
        if (found) {
          this.currentImgURL = found.imgURL || '';
          this.selectedCategoryId = (typeof found.category === 'object' ? found.category?._id : found.category) || '';
          this.selectedSubCategoryId = (typeof found.subCategory === 'object' ? found.subCategory?._id : found.subCategory) || '';
          
          if (this.selectedCategoryId) {
            this.loadSubCategories(this.selectedCategoryId);
          }

          this.editForm.patchValue({
            name: found.name,
            desc: found.desc || '',
            price: found.price,
            discount: found.discount || 0,
            stock: found.stock,
            slug: found.slug || '',
            isActive: found.isActive !== false,
            newArrived: found.newArrived || false,
            mostPopular: found.mostPopular || false
          });
        } else {
          this.errorMessage = 'Product not found.';
        }
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load product details.';
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  // === Category Modal ===
  openCategoryModal() {
    this.showCategoryModal = true;
    this.newCategoryName = '';
    this.newSubCategoryName = '';
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

    const addCat = (imgURL?: string) => {
      const payload = { name: this.newCategoryName.trim(), imgURL };
      const sub = this._categoryService.addCategory(payload).subscribe({
        next: (res: any) => {
          this.isAddingCategory = false;
          this.showCategoryModal = false;
          const cat = res?.data;
          if (cat?._id) {
            this.categories = [...this.categories, cat];
            this.selectedCategoryId = cat._id;
            this.loadSubCategories(cat._id);
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
      this.subscriptions.add(sub);
    };

    if (this.newCategoryFile) {
      const uploadSub = this._cloudinaryService.uploadImage(this.newCategoryFile, this.newCategoryFile.name).subscribe({
        next: (res) => {
          addCat(res.secure_url);
        },
        error: () => {
          this.isAddingCategory = false;
          this.categoryModalError = 'Failed to upload category image.';
          this._cdr.detectChanges();
        }
      });
      this.subscriptions.add(uploadSub);
    } else {
      addCat();
    }
  }

  // === SubCategory Modal ===
  openSubCategoryModal() {
    this.showSubCategoryModal = true;
    this.targetCategoryIdForSub = this.selectedCategoryId || (this.categories.length > 0 ? this.categories[0]._id : '');
    this.newSubCatName = '';
    this.subCategoryModalError = '';
    this._cdr.detectChanges();
  }

  closeSubCategoryModal() {
    this.showSubCategoryModal = false;
    this._cdr.detectChanges();
  }

  submitNewSubCategory() {
    this.subCategoryModalError = '';
    if (!this.newSubCatName.trim()) {
      this.subCategoryModalError = 'Please enter a subcategory name.';
      return;
    }
    if (!this.targetCategoryIdForSub) {
      this.subCategoryModalError = 'Please select a parent category for this subcategory.';
      return;
    }

    this.isAddingSubCategory = true;
    this._cdr.detectChanges();

    const payload = {
      name: this.newSubCatName.trim(),
      slug: this.newSubCatName.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'),
      categoryId: this.targetCategoryIdForSub,
      category: this.targetCategoryIdForSub
    };

    const sub = this._subCategoryService.addSubCategory(payload).subscribe({
      next: (res: any) => {
        this.isAddingSubCategory = false;
        this.showSubCategoryModal = false;
        const newSub = res?.data;

        this.selectedCategoryId = this.targetCategoryIdForSub;
        this.isLoadingSubCategories = true;
        this._subCategoryService.getSubCategoriesByMain(this.targetCategoryIdForSub).subscribe({
          next: (subRes) => {
            this.subCategories = subRes.data || [];
            if (newSub?._id) {
              this.selectedSubCategoryId = newSub._id;
            } else if (this.subCategories.length > 0) {
              this.selectedSubCategoryId = this.subCategories[this.subCategories.length - 1]._id;
            }
            this.isLoadingSubCategories = false;
            this._cdr.detectChanges();
          },
          error: () => {
            this.isLoadingSubCategories = false;
            this._cdr.detectChanges();
          }
        });
        this._cdr.detectChanges();
      },
      error: (err: any) => {
        this.isAddingSubCategory = false;
        this.subCategoryModalError = err?.error?.message || 'Failed to create subcategory.';
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  // Handles image file selection
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const fileNameLower = (file.name || '').toLowerCase();
      this.selectedFile = file;
    }
  }

  // Submits product updates
  async onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields (Name, Description, Price, Stock).';
      return;
    }

    const confirmed = await this._modalService.confirm({
      title: 'Confirm Save Changes',
      message: 'Are you sure you want to save the changes made to this product?',
      confirmText: 'Yes, Save Changes',
      cancelText: 'Cancel',
      type: 'info'
    });

    if (!confirmed) return;

    this.isSaving = true;
    this._cdr.detectChanges();

    const updateProductData = (imgURL?: string) => {
      const payload: any = {
        name: this.editForm.get('name')?.value || '',
        desc: this.editForm.get('desc')?.value || '',
        price: this.editForm.get('price')?.value || 0,
        discount: this.editForm.get('discount')?.value || 0,
        stock: this.editForm.get('stock')?.value || 0,
        slug: this.editForm.get('slug')?.value || '',
        isActive: this.editForm.get('isActive')?.value,
        newArrived: this.editForm.get('newArrived')?.value,
        mostPopular: this.editForm.get('mostPopular')?.value
      };

      if (this.selectedCategoryId) {
        payload.category = this.selectedCategoryId;
      }

      if (this.selectedSubCategoryId) {
        payload.subCategory = this.selectedSubCategoryId;
      }

      if (imgURL) {
        payload.imgURL = imgURL;
      }

      const sub = this._productService.updateProduct(this.productId, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.successMessage = 'Product updated successfully!';
          this._cdr.detectChanges();
          setTimeout(() => {
            this._router.navigate(['/admin/products']);
          }, 1200);
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err?.error?.message || 'Failed to update product.';
          this._cdr.detectChanges();
        }
      });
      this.subscriptions.add(sub);
    };

    if (this.selectedFile) {
      const uploadSub = this._cloudinaryService.uploadImage(this.selectedFile, this.selectedFile.name).subscribe({
        next: (res) => {
          updateProductData(res.secure_url);
        },
        error: () => {
          this.isSaving = false;
          this.errorMessage = 'Failed to upload image to Cloudinary.';
          this._cdr.detectChanges();
        }
      });
      this.subscriptions.add(uploadSub);
    } else {
      updateProductData();
    }
  }

  // Soft deletes product by ID
  async onSoftDelete() {
    const confirmDelete = await this._modalService.confirm({
      title: 'Soft Delete Product',
      message: 'Are you sure you want to soft delete / disable this product?',
      confirmText: 'Yes, Delete',
      cancelText: 'No, Keep it',
      type: 'danger'
    });

    if (!confirmDelete) return;

    this.isSaving = true;
    this._cdr.detectChanges();
    const sub = this._productService.deleteProduct(this.productId).subscribe({
      next: () => {
        this.successMessage = 'Product soft-deleted / archived successfully!';
        this._cdr.detectChanges();
        setTimeout(() => {
          this._router.navigate(['/admin/products']);
        }, 1200);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to delete product.';
        this._cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
